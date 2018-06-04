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
        const name = node.tagName;
        const isRC = !htmlTags.includes(name);
        const tableRC = table.components[name];
        if (isRC && tableRC) {
          const children = node.children;
          const componentNode = Object.assign({}, tableRC.node);
          // Remove React Components in the same file.
          removeNode(tableRC.parent, tableRC.node);
          // Handle children
          if (children.length) {
            componentNode.children[0].children = children;
          }
          // Convert Element in Mixin.
          Object.assign(node, componentNode);
          delete node.tagName;
          delete node.attributes;
          // Check again if new Mixin has React Components.
          optimize(node, table);
        }
      }
    }
  });
  return ast;
}

export default optimize;

function removeNode(parent, node) {
  switch (node.type) {
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

    // if (method && method.enter) {
    //   method.enter(node, parent);
    // }

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
