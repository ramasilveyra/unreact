/* eslint-disable no-param-reassign, no-underscore-dangle */
import * as t from '@babel/types';
import babelTraverse from '@babel/traverse';
import babelGenerator from '@babel/generator';
import { iterationName } from '../ast';
import parser from '../parser';

function createInliningVisitor(props) {
  return {
    Attribute: {
      exit(node, parent) {
        inlineNodeVisitor(node, parent, props, 'valuePath');
      }
    },
    InterpolationEscaped: {
      exit(node, parent) {
        inlineNodeVisitor(node, parent, props, 'valuePath');
      }
    },
    Iteration: {
      exit(node, parent) {
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
    inline(props, node[key], parent);
    return;
  }
  node[key].traverse({
    Identifier(path) {
      if (t.isMemberExpression(path.parent)) {
        return;
      }
      inline(props, path, parent);
    }
  });
}

function inline(props, path, parent) {
  const iteration = findParent(parent, node => node.type === iterationName);
  const matchedProp = props.find(prop => prop.name === path.node.name);
  if (iteration && iteration.currentValuePath.node.name === path.node.name) {
    return;
  }
  if (!matchedProp || !matchedProp.value) {
    path.node.name = 'undefined';
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
  if (matchedProp.name === 'children') {
    const position = parent.children.findIndex(child => {
      if (child.valuePath) {
        return t.isIdentifier(child.valuePath.node, { name: 'children' });
      }
      return false;
    });
    parent.children = [
      ...parent.children.slice(0, position),
      ...matchedProp.value,
      ...parent.children.slice(position + 1)
    ];
    return;
  }
  const matchedPropNode = matchedProp.value.valuePath.node;
  if (t.isIdentifier(matchedPropNode)) {
    path.node.name = matchedPropNode.name;
    return;
  }
  path.replaceWith(matchedPropNode);
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
