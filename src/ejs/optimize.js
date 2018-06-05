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
  textName,
  createText
} from '../ast';

function optimize(ast, table) {
  traverser(ast, {
    Element: {
      exit(node) {
        const name = node.tagName;
        const isRC = !htmlTags.includes(name);
        const tableRC = table.components[name];
        if (isRC && tableRC) {
          // Generate collection of props name and value.
          const propsToInline =
            tableRC.node.props &&
            tableRC.node.props.map(prop => {
              if (prop === 'children' && node.children) {
                return { name: prop, value: node.children };
              }
              return {
                name: prop,
                value: node.attributes.find(attr => attr.name === prop)
              };
            });
          // Clone Mixin.
          const componentNode = Object.assign({}, tableRC.node);
          // Remove React Components in the same file.
          removeNode(tableRC.parent, tableRC.node);
          // Convert Element in Mixin.
          Object.assign(node, componentNode);
          delete node.tagName;
          delete node.attributes;
          // Inline props.
          if (propsToInline) {
            inlinepProps(node, propsToInline);
          }
          // Check again if new Mixin has React Components.
          optimize(node, table);
        }
      }
    }
  });
  return ast;
}

export default optimize;

function inlinepProps(ast, props) {
  traverser(ast, {
    Attribute: {
      exit(node) {
        const propToInline = props.find(prop => prop.name === node.value);
        if (propToInline && propToInline.value && propToInline.value.expression) {
          node.value = propToInline.value.value;
          return;
        }
        if (propToInline && propToInline.value && propToInline.value.expression === false) {
          node.value = propToInline.value.value;
          node.expression = false;
        }
      }
    },
    InterpolationEscaped: {
      exit(node, parent) {
        const propToInline = props.find(prop => prop.name === node.value);
        if (propToInline && propToInline.value && propToInline.value.expression) {
          node.value = propToInline.value.value;
          return;
        }
        if (propToInline && propToInline.value && propToInline.value.expression === false) {
          // convert node to string
          const text = createText(propToInline.value.value);
          Object.assign(node, text);
          return;
        }
        if (propToInline && propToInline.value) {
          // convert node to children
          parent.children = propToInline.value;
        }
      }
    }
  });
}

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
