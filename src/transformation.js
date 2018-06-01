/* eslint-disable no-underscore-dangle, no-param-reassign */
import babelTraverse from '@babel/traverse';
import babelGenerator from '@babel/generator';
import * as t from '@babel/types';
import cleanJSXElementLiteralChild from '@babel/types/lib/utils/react/cleanJSXElementLiteralChild';
import {
  createAttribute,
  createCondition,
  createElement,
  createIteration,
  createInterpolationEscaped,
  createMixin,
  createRoot,
  createText,
  rootName,
  elementName,
  conditionName,
  iterationName,
  mixinName
} from './ast';

function transformation(oldAst) {
  const newAst = createRoot();

  setContext(oldAst, newAst);

  const reactComponentVisitor = {
    JSXElement(path) {
      const tagName = path.node.openingElement.name.name;
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
      if (t.isLogicalExpression(path.node, { operator: '||' })) {
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
      if (t.isJSXExpressionContainer(valueNode)) {
        const { code } = babelGenerator(valueNode.expression);
        const attribute = createAttribute(name, code, true);
        addToContext(context, attribute, 'attributes');
      }
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
      const context = getContext(path);
      if (t.isLogicalExpression(path.node, { operator: '&&' })) {
        const { code } = babelGenerator(path.node.left);
        const condition = createCondition(code);
        addToContext(context, condition);
        setContext(path, condition);
        return;
      }
      if (t.isLogicalExpression(path.node, { operator: '||' })) {
        const { code } = babelGenerator(path.node.left);
        const interpolationEscaped = createInterpolationEscaped(code);
        const condition = createCondition(code, interpolationEscaped);
        addToContext(context, condition);
        setContext(path, condition);
      }
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
    VariableDeclaration(path) {
      const isRC = isFunctionalReactComponent(path);
      if (isRC) {
        const context = getContext(path);
        const mixin = createMixin();
        addToContext(context, mixin);
        setContext(path, mixin);
        path.traverse(reactComponentVisitor);
      }
    }
  };

  babelTraverse(oldAst, generalVisitor, null);

  return newAst;
}

export default transformation;

// Note: this makes a lot of assumptions based on common conventions, it's not accurate.
function isFunctionalReactComponent(path) {
  const node = path.node;
  const isVariableDeclaration = t.isVariableDeclaration(node);
  const isFunctionDeclaration = t.isFunctionDeclaration(node);
  if (!isVariableDeclaration && !isFunctionDeclaration) {
    return false;
  }
  const name = isVariableDeclaration ? node.declarations[0].id.name : node.id.name;
  const startsWithCapitalLetter = name[0] === name[0].toUpperCase();
  if (!startsWithCapitalLetter) {
    return false;
  }
  if (isJSXElementOrReactCreateElement(path)) {
    return true;
  }
  return false;
}

function isJSXElementOrReactCreateElement(path) {
  let visited = false;

  path.traverse({
    JSXElement() {
      visited = true;
    }
  });

  return visited;
}

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

function addToContext(context, node, member) {
  if (member) {
    addNode(context, node, member);
    return;
  }
  switch (context.type) {
    case rootName:
    case elementName:
    case mixinName:
      addNode(context, node, 'children');
      break;
    case iterationName:
      addNode(context, node, 'body');
      break;
    case conditionName:
      if (context.consequent) {
        addNode(context, node, 'alternate');
      } else {
        addNode(context, node, 'consequent');
      }
      break;
    default:
      throw new Error(`Don't know how to add node to ${context.type}`);
  }
}

function isMapIterator(node) {
  const callee = node.callee;
  if (!callee || !callee.property) {
    return false;
  }
  const is = callee.property.name === 'map';
  return is;
}

function addNode(context, node, member) {
  if (Array.isArray(context[member])) {
    context[member].push(node);
    return;
  }
  context[member] = node;
}

function shouldIgnoreAttr(name) {
  if (['key', 'onClick', 'ref'].includes(name)) {
    return true;
  }
  return false;
}
