/* eslint-disable no-param-reassign, no-underscore-dangle */
import {
  attributeName,
  conditionName,
  elementName,
  interpolationEscapedName,
  interpolationUnescapedName,
  iterationName,
  mixinName,
  rootName,
  textName
} from './ast';

export default function traverser(ast, visitor) {
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node, parent) {
    const method = visitor[node.type];

    node._parent = parent;

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
      case attributeName:
        if (node.isNode && node.valueNode) {
          traverseNode(node.valueNode, node);
        }
        break;
      case textName:
      case interpolationEscapedName:
      case interpolationUnescapedName:
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
