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

      const expression = path.node.expression;

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

      if (t.isIdentifier(expression)) {
        const interpolationEscaped = createInterpolationEscaped(expression.name);
        addToContext(context, interpolationEscaped);
        return;
      }
      const { code } = babelGenerator(expression);
      const interpolationEscaped = createInterpolationEscaped(code);
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
        const attribute = createAttribute(name, true);
        addToContext(context, attribute, 'attributes');
        return;
      }
      if (t.isStringLiteral(valueNode)) {
        const attribute = createAttribute(name, valueNode.value);
        addToContext(context, attribute, 'attributes');
        return;
      }
      if (t.isJSXExpressionContainer(valueNode) && t.isIdentifier(valueNode.expression)) {
        const attribute = createAttribute(name, valueNode.expression.name, true);
        addToContext(context, attribute, 'attributes');
        return;
      }
      const { code } = babelGenerator(valueNode.expression);
      const attribute = createAttribute(name, code, true);
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
      const context = getContext(path);
      if (path.node.operator === '&&') {
        const { code } = babelGenerator(path.node.left);
        const condition = createCondition(code);
        addToContext(context, condition);
        setContext(path, condition);
        return;
      }
      const { code } = babelGenerator(path.node.left);
      const interpolationEscaped = createInterpolationEscaped(code);
      const condition = createCondition(code, interpolationEscaped);
      addToContext(context, condition);
      setContext(path, condition);
    },
    ConditionalExpression(path) {
      const context = getContext(path);
      const ignoreConsequent = t.isNullLiteral(path.node.consequent);
      const { code } = babelGenerator(path.node.test);
      const test = ignoreConsequent ? `!(${code})` : code;
      const condition = createCondition(test);
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
  if (path.type === 'File') {
    path.program._context = context;
    return;
  }

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
