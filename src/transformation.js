/* eslint-disable no-underscore-dangle, no-param-reassign */
import babelTraverse from '@babel/traverse';
import babelGenerator from '@babel/generator';
import * as t from '@babel/types';
import {
  createElement,
  createTemplateEscaped,
  createProperty,
  createRoot,
  createText
} from './ast';

function transformation(oldAst) {
  const newAst = createRoot();

  setContext(oldAst, newAst);

  const reactComponentVisitor = {
    JSXElement(path) {
      const tagName = path.node.openingElement.name.name;
      const element = createElement(tagName);
      const context = getContext(path);
      context.children.push(element);
      setContext(path, element);
    },
    JSXText(path) {
      const value = path.node.value;
      const text = createText(value);
      const context = getContext(path);
      context.children.push(text);
    },
    JSXExpressionContainer(path) {
      if (t.isJSXAttribute(path.parent)) {
        return;
      }
      const context = getContext(path);
      const expression = path.node.expression;
      if (t.isIdentifier(expression)) {
        const templateEscaped = createTemplateEscaped(expression.name);
        context.children.push(templateEscaped);
        return;
      }
      const { code } = babelGenerator(expression);
      const templateEscaped = createTemplateEscaped(code);
      context.children.push(templateEscaped);
    },
    JSXAttribute(path) {
      const context = getContext(path);
      const name = path.node.name.name;
      const valueNode = path.node.value;
      if (!valueNode) {
        const property = createProperty(name, true);
        context.properties.push(property);
        return;
      }
      if (t.isStringLiteral(valueNode)) {
        const property = createProperty(name, valueNode.value);
        context.properties.push(property);
        return;
      }
      if (t.isJSXExpressionContainer(valueNode) && t.isIdentifier(valueNode.expression)) {
        const property = createProperty(name, valueNode.expression.name, true);
        context.properties.push(property);
        return;
      }
      if (t.isJSXExpressionContainer(valueNode)) {
        const { code } = babelGenerator(valueNode.expression);
        const property = createProperty(name, code, true);
        context.properties.push(property);
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
