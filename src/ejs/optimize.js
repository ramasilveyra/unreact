/* eslint-disable no-param-reassign */
import htmlTags from 'html-tags';
import { createText } from '../ast';
import traverser from '../traverser';

function optimize(ast, table) {
  traverser(ast, {
    Element: {
      exit(node) {
        const name = node.tagName;
        const isRC = !htmlTags.includes(name);
        const tableRC = getTableComponent(name, table);
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

function getTableComponent(name, table) {
  if (table.components[name]) {
    return table.components[name];
  }
  const tableDep = table.dependencies[name];
  if (tableDep) {
    const component = Object.values(table.components).find(
      rc => rc.createdFrom === tableDep.path && rc.defaultExport
    );
    return component;
  }
  return null;
}

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
