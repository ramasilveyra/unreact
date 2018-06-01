/* eslint-disable no-underscore-dangle, no-param-reassign */
import babelTraverse from '@babel/traverse';
import babelGenerator from '@babel/generator';
import * as t from '@babel/types';
import {
  createAttribute,
  createCondition,
  createElement,
  createInterpolationEscaped,
  createRoot,
  createText,
  rootName,
  elementName,
  conditionName
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
      const value = path.node.value;
      const text = createText(value);
      const context = getContext(path);
      addToContext(context, text);
    },
    JSXExpressionContainer(path) {
      // Let JSXAttribute visitor handle JSXExpressionContainer of attributes.
      if (t.isJSXAttribute(path.parent)) {
        return;
      }
      const context = getContext(path);
      const expression = path.node.expression;
      if (t.isIdentifier(expression)) {
        const interpolationEscaped = createInterpolationEscaped(expression.name);
        addToContext(context, interpolationEscaped);
        return;
      }
      if (t.isLogicalExpression(expression, { operator: '&&' })) {
        const { code } = babelGenerator(expression.left);
        const condition = createCondition(code);
        addToContext(context, condition);
        setContext(path, condition);
        return;
      }
      if (t.isConditionalExpression(expression)) {
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
    ConditionalExpression(path) {
      const context = getContext(path);
      const { code: test } = babelGenerator(path.node.test);
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
      // TODO: validate that is a functional component before proceed.
      path.traverse(reactComponentVisitor);
    }
  };

  babelTraverse(oldAst, generalVisitor, null, { newAst });

  return newAst;
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

function addToContext(context, node, member) {
  if (member) {
    if (Array.isArray(context[member])) {
      context[member].push(node);
      return;
    }
    context[member] = node;
    return;
  }
  switch (context.type) {
    case rootName:
    case elementName:
      context.children.push(node);
      break;
    case conditionName:
      if (context.consequent) {
        context.alternate = node;
      } else {
        context.consequent = node;
      }
      break;
    default:
      throw new Error(`Don't know how to add node to ${context.type}`);
  }
}
