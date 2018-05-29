/* eslint-disable no-underscore-dangle, no-param-reassign */
import babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import { createElement, createEJSEscaped, createRoot, createText } from './ast';

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
      const context = getContext(path);
      const expression = path.node.expression;
      if (t.isIdentifier(expression)) {
        const ejsEscaped = createEJSEscaped(expression.name);
        context.children.push(ejsEscaped);
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
