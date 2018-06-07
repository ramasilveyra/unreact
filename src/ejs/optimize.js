/* eslint-disable no-param-reassign */
import htmlTags from 'html-tags';
import _ from 'lodash';
import MagicString from 'magic-string';
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
          const componentNode = _.merge({}, tableRC.node);
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
        const value = new MagicString(node.value);
        props.forEach(prop => {
          if (!node.identifiers) {
            return;
          }
          const propIDs = node.identifiers[prop.name];
          if (prop.value && propIDs) {
            const propValue = prop.value.value;
            propIDs.forEach(propID => {
              const content =
                prop.value.expression === false ? `'${String(propValue)}'` : String(propValue);
              value.overwrite(propID.start, propID.end, String(content));
            });
            node.value = value.toString();
          }
        });
      }
    },
    InterpolationEscaped: {
      exit(node, parent) {
        const value = new MagicString(node.value);
        props.forEach(prop => {
          const propIDs = node.identifiers[prop.name];
          if (prop.value && propIDs) {
            const propValue = prop.value.value;
            if (!propValue) {
              parent.children = prop.value;
              return;
            }
            propIDs.forEach(propID => {
              const content =
                prop.value.expression === false ? `'${String(propValue)}'` : String(propValue);
              value.overwrite(propID.start, propID.end, String(content));
            });
            node.value = value.toString();
          }
        });
      }
    },
    Iteration: {
      exit(node) {
        const propToInline = props.find(prop => prop.name === node.iterable);
        if (propToInline && propToInline.value && propToInline.value.expression) {
          node.iterable = propToInline.value.value;
        }
      }
    },
    Condition: {
      exit(node) {
        const test = new MagicString(node.test);
        props.forEach(prop => {
          const propIDs = node.identifiers[prop.name];
          if (prop.value && propIDs) {
            const propValue = prop.value.value;
            if (prop.value.expression === false) {
              node.test = `"${propValue}"`;
              return;
            }
            propIDs.forEach(propID => {
              test.overwrite(propID.start, propID.end, String(propValue));
            });
            node.test = test.toString();
          }
        });
      }
    }
  });
}
