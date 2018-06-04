/* eslint-disable no-param-reassign */
import htmlTags from 'html-tags';
import {
  attributeName,
  conditionName,
  elementName,
  interpolationEscapedName,
  iterationName,
  mixinName,
  rootName,
  textName
} from '../ast';

function optimize(ast, table) {
  traverser(ast, {
    Element: {
      exit(node) {
        const isRC = !htmlTags.includes(node.tagName);
        if (isRC) {
          const children = node.children;
          if (!table.components[node.tagName]) {
            return;
          }
          const componentNode = Object.assign({}, table.components[node.tagName].node);
          removeNode(table.components[node.tagName].parent, table.components[node.tagName].node);
          if (children.length) {
            componentNode.children[0].children = children;
          }
          Object.assign(node, componentNode);
          delete node.tagName;
          delete node.attributes;
        }
      }
    }
  });
  return ast;
}

export default optimize;

function removeNode(parent, node) {
  switch (node.type) {
    case rootName:
    case elementName:
    case mixinName:
      node.children = node.children.filter(child => child === node);
      break;
    default:
      throw new TypeError(node.type);
  }
}

function traverser(ast, visitor) {
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node, parent) {
    const method = visitor[node.type];

    if (method && method.enter) {
      method.enter(node, parent);
    }

    switch (node.type) {
      case rootName:
      case mixinName:
        traverseArray(node.children, node);
        break;
      case elementName:
        traverseArray(node.children, node);
        traverseArray(node.attributes, node);
        break;
      case conditionName:
        traverseNode(node.consequent, node);
        if (node.alternate) {
          traverseNode(node.alternate, node);
        }
        break;
      case iterationName:
        traverseNode(node.body, node);
        break;
      case textName:
      case attributeName:
      case interpolationEscapedName:
        break;
      default:
        throw new TypeError(node.type);
    }

    if (method && method.exit) {
      method.exit(node, parent);
    }
  }

  traverseNode(ast, null);
}
