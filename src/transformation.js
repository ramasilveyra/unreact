/* eslint-disable no-underscore-dangle, no-param-reassign */
import babelTraverse from '@babel/traverse';
import babelGenerator from '@babel/generator';
import * as t from '@babel/types';
import cleanJSXElementLiteralChild from '@babel/types/lib/utils/react/cleanJSXElementLiteralChild';
import {
  createAttribute,
  createCondition,
  createElement,
  createInterpolationEscaped,
  createIteration,
  createMixin,
  createRoot,
  createText
} from './ast';
import isFunctionalReactComponent from './utils/is-functional-react-component';
import getReactComponentName from './utils/get-react-component-name';
import addToContext from './utils/add-to-context';
import getReactComponentProps from './utils/get-react-component-props';
import inlineStyles from './utils/inline-styles';

function transformation(oldAst, inputFilePath) {
  const newAst = createRoot();
  const table = { components: {}, dependencies: {} };

  const reactComponentVisitor = {
    JSXElement(path) {
      const tagName = path.node.openingElement.name.name;
      const isFromDependency = table.dependencies[tagName];
      if (isFromDependency) {
        isFromDependency.isUsedAsRC = true;
      }
      const element = createElement(tagName);
      const context = getContext(path);
      addToContext(context, element);
      setContext(path, element);
    },
    JSXText(path) {
      const elems = [];
      cleanJSXElementLiteralChild(path.node, elems);
      const value = elems[0] ? elems[0].value : '';
      if (!value) {
        return;
      }
      const text = createText(value);
      const context = getContext(path);
      addToContext(context, text);
    },
    JSXExpressionContainer(path) {
      // Let JSXAttribute visitor handle JSXExpressionContainer of attributes.
      if (t.isJSXAttribute(path.parent)) {
        return;
      }

      const expressionPath = path.get('expression');
      const expression = expressionPath.node;

      if (t.isLogicalExpression(expression, { operator: '&&' })) {
        return;
      }
      if (t.isLogicalExpression(expression, { operator: '||' })) {
        return;
      }
      if (t.isConditionalExpression(expression)) {
        return;
      }

      const isIterator = isMapIterator(expression);

      if (isIterator) {
        return;
      }

      const context = getContext(path);
      const identifiers = getIdentifiersInfo(expressionPath);

      if (t.isIdentifier(expression)) {
        const interpolationEscaped = createInterpolationEscaped(expression.name, identifiers);
        addToContext(context, interpolationEscaped);
        return;
      }
      const { code } = babelGenerator(expression);
      const interpolationEscaped = createInterpolationEscaped(code, identifiers);
      addToContext(context, interpolationEscaped);
    },
    JSXAttribute(path) {
      const context = getContext(path);
      const name = path.node.name.name;
      const valueNode = path.node.value;
      if (shouldIgnoreAttr(name)) {
        return;
      }
      if (!valueNode) {
        const attribute = createAttribute({ name, value: true, expression: true });
        addToContext(context, attribute, 'attributes');
        return;
      }
      if (t.isStringLiteral(valueNode)) {
        const attribute = createAttribute({ name, value: valueNode.value });
        addToContext(context, attribute, 'attributes');
        return;
      }
      const expression = path.get('value.expression');
      const identifiers = getIdentifiersInfo(expression);
      if (t.isJSXExpressionContainer(valueNode) && t.isIdentifier(expression.node)) {
        const attribute = createAttribute({
          name,
          value: expression.node.name,
          expression: true,
          identifiers
        });
        addToContext(context, attribute, 'attributes');
        return;
      }
      if (name === 'style') {
        const styles = {};
        expression.node.properties.forEach(prop => {
          styles[prop.key.name] = prop.value.value;
        });
        const stringInlineStyles = inlineStyles(styles);
        if (stringInlineStyles) {
          const attribute = createAttribute({ name, value: stringInlineStyles });
          addToContext(context, attribute, 'attributes');
        }
        return;
      }
      const { code } = babelGenerator(expression.node, { concise: true });
      const attribute = createAttribute({ name, value: code, expression: true, identifiers });
      addToContext(context, attribute, 'attributes');
    },
    CallExpression(path) {
      const callee = path.node.callee;
      const aarguments = path.node.arguments[0];
      const isIterator = isMapIterator(path.node);
      if (isIterator) {
        const context = getContext(path);
        const { code } = babelGenerator(callee);
        const iterable = code.replace('.map', '');
        const currentValue = aarguments.params[0].name;
        const index = aarguments.params[1] ? aarguments.params[1].name : null;
        const array = aarguments.params[2] ? aarguments.params[2].name : null;
        const iteration = createIteration({ iterable, currentValue, index, array });
        addToContext(context, iteration);
        setContext(path, iteration);
      }
    },
    LogicalExpression(path) {
      if (t.isConditionalExpression(path.parent) && path.parent.test === path.node) {
        return;
      }
      if (path.findParent(node => t.isJSXAttribute(node))) {
        return;
      }
      const left = path.get('left');
      const context = getContext(path);
      const identifiers = getIdentifiersInfo(left);
      if (path.node.operator === '&&') {
        const { code } = babelGenerator(left.node);
        const condition = createCondition({ test: code, identifiers });
        addToContext(context, condition);
        setContext(path, condition);
        return;
      }
      const { code } = babelGenerator(left.node);
      const interpolationEscaped = createInterpolationEscaped(code, identifiers);
      const condition = createCondition({
        test: code,
        consequent: interpolationEscaped,
        identifiers
      });
      addToContext(context, condition);
      setContext(path, condition);
    },
    ConditionalExpression(path) {
      const testPath = path.get('test');
      const context = getContext(path);
      const ignoreConsequent = t.isNullLiteral(path.node.consequent);
      const padding = ignoreConsequent ? 2 : 0;
      const identifiers = getIdentifiersInfo(testPath, padding);
      const { code } = babelGenerator(testPath.node);
      const test = ignoreConsequent ? `!(${code})` : code;
      const condition = createCondition({ test, identifiers });
      addToContext(context, condition);
      setContext(path, condition);
    },
    StringLiteral(path) {
      if (t.isConditionalExpression(path.parent)) {
        const context = getContext(path);
        const text = createText(path.node.value);
        addToContext(context, text);
      }
    }
  };

  const generalVisitor = {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const specifier = path.node.specifiers.find(node => t.isImportDefaultSpecifier(node)).local
        .name;
      table.dependencies[specifier] = { source, requiredFrom: inputFilePath };
    },
    VariableDeclaration(path) {
      checkForReactComponent(path);
    },
    FunctionDeclaration(path) {
      checkForReactComponent(path);
    },
    ExportDefaultDeclaration(path) {
      const exportedComponent = path.node.declaration.name;
      const component = table.components[exportedComponent];
      if (component) {
        component.defaultExport = true;
      }
    }
  };

  babelTraverse(oldAst, generalVisitor, null);

  const mainComponent = Object.values(table.components).find(component => component.defaultExport);
  addToContext(newAst, mainComponent.node);

  return { ast: newAst, table };

  function checkForReactComponent(path) {
    const is = isFunctionalReactComponent(path);
    const name = getReactComponentName(path.node);
    const defaultExport = t.isFunctionDeclaration(path.node)
      ? t.isExportDefaultDeclaration(path.parent)
      : false;
    const props = getReactComponentProps(path.node);
    if (is) {
      const mixin = createMixin(name, props);
      setContext(path, mixin);
      table.components[name] = {
        node: mixin,
        defaultExport,
        createdFrom: inputFilePath
      };
      path.traverse(reactComponentVisitor);
    }
  }
}

export default transformation;

function setContext(path, context) {
  path.node._context = context;
}

function getContext(path) {
  const context = path.findParent(pathItem => !!pathItem.node._context).node._context;
  return context;
}

function isMapIterator(node) {
  const callee = node.callee;
  if (!callee || !callee.property) {
    return false;
  }
  const is = callee.property.name === 'map';
  return is;
}

function shouldIgnoreAttr(name) {
  if (['key', 'onClick', 'ref'].includes(name)) {
    return true;
  }
  return false;
}

function getIdentifiersInfo(path, padding = 0) {
  const start = path.node.start;
  const info = {};
  if (t.isIdentifier(path.node)) {
    const { name, info: idInfo } = getIdentifierInfo(path.node, start, padding);
    info[name] = [idInfo];
    return info;
  }
  path.traverse({
    Identifier({ node }) {
      const { name, info: idInfo } = getIdentifierInfo(node, start, padding);
      if (info[name]) {
        info[name].push(idInfo);
      } else {
        info[name] = [idInfo];
      }
    }
  });
  return info;
}

function getIdentifierInfo(node, start, padding) {
  const idStart = node.start - start + padding;
  const idEnd = node.end - start + padding;
  const name = node.name;
  const info = { start: idStart, end: idEnd };
  return { name, info };
}
