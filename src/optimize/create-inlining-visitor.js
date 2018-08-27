/* eslint-disable no-param-reassign, no-underscore-dangle */
import * as t from '@babel/types';
import babelTraverse from '@babel/traverse';
import babelGenerator from '@babel/generator';
import { iterationName, interpolationEscapedName } from '../ast';
import parser from '../parser';

function createInliningVisitor(props) {
  return {
    Attribute: {
      enter(node, parent) {
        inlineNodeVisitor(node, parent, props, 'valuePath');
      }
    },
    InterpolationEscaped: {
      enter(node, parent) {
        inlineNodeVisitor(node, parent, props, 'valuePath');
      }
    },
    Iteration: {
      enter(node, parent) {
        inlineNodeVisitor(node, parent, props, 'iterablePath');
      }
    },
    Condition: {
      enter(node, parent) {
        inlineNodeVisitor(node, parent, props, 'testPath');
      }
    }
  };
}

export default createInliningVisitor;

function inlineNodeVisitor(node, parent, props, key) {
  if (!node[key]) {
    return;
  }
  node[key] = clonePath(node[key].node);
  if (t.isIdentifier(node[key].node) && !t.isMemberExpression(node[key].parent)) {
    inline(props, node[key], parent, node);
    return;
  }
  node[key].traverse({
    Identifier(path) {
      const isObjectKey = t.isObjectProperty(path.parent) && path.parent.key === path.node;
      if (t.isMemberExpression(path.parent) || isObjectKey) {
        return;
      }
      inline(props, path, parent, node);
    }
  });
}

function inline(props, path, parent, node) {
  const iteration = findParent(parent, n => n.type === iterationName);
  const matchedProp = props.find(prop => prop.name === path.node.name);
  const definition = matchedProp && matchedProp.definition;
  if (
    iteration &&
    (iteration.currentValuePath.node.name === path.node.name ||
      (iteration.indexPath && iteration.indexPath.node.name === path.node.name) ||
      (iteration.arrayPath && iteration.arrayPath.node.name === path.node.name))
  ) {
    return;
  }
  if (!matchedProp || !matchedProp.value) {
    if (definition && definition.defaultPath) {
      path.replaceWith(definition.defaultPath.node);
      return;
    }
    if (!node.resolved) {
      path.node.name = 'undefined';
    }
    return;
  }
  if (matchedProp.value.isBoolean) {
    path.replaceWith(t.BooleanLiteral(true));
    return;
  }
  if (matchedProp.value.isString) {
    path.replaceWith(t.stringLiteral(matchedProp.value.value));
    return;
  }
  if (matchedProp.value.isNode) {
    if (isInterpolationEscapedId(matchedProp.name, node.consequent)) {
      node.consequent = matchedProp.value.valueNode;
      path.replaceWith(t.booleanLiteral(true));
      return;
    }
    const wasInserted = insertChildren(parent, matchedProp.name, matchedProp.value.valueNode);
    if (wasInserted) {
      return;
    }
    path.replaceWith(t.booleanLiteral(true));
    return;
  }
  if (matchedProp.name === 'children') {
    insertChildren(parent, 'children', matchedProp.value);
    return;
  }
  const matchedPropNode = matchedProp.value.valuePath.node;
  if (t.isIdentifier(matchedPropNode)) {
    path.node.name = matchedPropNode.name;
    node.resolved = true;
    return;
  }
  path.replaceWith(matchedPropNode);
  node.resolved = true;
}

function findParent(node, condition) {
  let target = node;
  while (target._parent) {
    if (condition(target)) {
      return target;
    }
    target = target._parent;
  }
  return null;
}

function clonePath(node) {
  const code = babelGenerator(node).code;
  const ast = parser(code);
  let newPath = null;
  babelTraverse(
    ast,
    {
      Program(path) {
        newPath = path.get('body.0');
        if (t.isExpressionStatement(newPath.node)) {
          newPath = newPath.get('expression');
        }
      }
    },
    null
  );
  return newPath;
}

function insertChildren(parent, identifierName, node) {
  const position = parent.children.findIndex(child =>
    isInterpolationEscapedId(identifierName, child)
  );
  if (position === -1) {
    return false;
  }
  parent.children = [
    ...parent.children.slice(0, position),
    ...(Array.isArray(node) ? node : [node]),
    ...parent.children.slice(position + 1)
  ];
  return true;
}

function isInterpolationEscapedId(identifierName, child) {
  if (child && child.type === interpolationEscapedName && child.valuePath) {
    return t.isIdentifier(child.valuePath.node, { name: identifierName });
  }
  return false;
}
