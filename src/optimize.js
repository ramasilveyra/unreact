/* eslint-disable no-param-reassign */
import htmlTags from 'html-tags';
import _ from 'lodash';
import MagicString from 'magic-string';
import babelTraverse from '@babel/traverse';
import traverser from './traverser';
import { conditionName, textName } from './ast';
import parse from './parser';

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
      exit(node, parent) {
        // 1. Inlining.
        if (!node.identifiers) {
          return;
        }
        const value = new MagicString(node.value);
        const propsToChange = props.filter(prop => prop.value && node.identifiers[prop.name]);
        const propsToNotChange = props.filter(prop => !prop.value && node.identifiers[prop.name]);
        propsToNotChange.forEach(prop => makeUndefined(node, prop, value));
        propsToChange.forEach(prop => {
          const propIDs = node.identifiers[prop.name];
          const propValue = prop.value.value;
          const canMakeText =
            Object.keys(node.identifiers).length === 1 &&
            propIDs.length === 1 &&
            propIDs[0].start === 0 &&
            propIDs[0].end === node.value.length;
          propIDs.forEach(propID => {
            const isText = prop.value.expression === false;
            const content = !canMakeText && isText ? `'${String(propValue)}'` : String(propValue);
            value.overwrite(propID.start, propID.end, content);
            if (canMakeText && isText) {
              // Make attr text;
              node.expression = false;
            }
          });
        });
        node.value = value.toString();
        // 2. Dead code elimination.
        if (node.value === 'undefined') {
          parent.attributes = parent.attributes.filter(attr => attr !== node);
          return;
        }
        if (node.expression) {
          const result = evaluate(node.value);
          const remove = result.confident && [null, undefined].includes(result.value);
          if (remove) {
            parent.attributes = parent.attributes.filter(attr => attr !== node);
            return;
          }
          if (result.confident) {
            node.value = result.value;
            node.expression = false;
          }
        }
      }
    },
    InterpolationEscaped: {
      exit(node, parent) {
        // 1. Inlining.
        const value = new MagicString(node.value);
        const propsToChange = props.filter(prop => prop.value && node.identifiers[prop.name]);
        const propsToNotChange = props.filter(prop => !prop.value && node.identifiers[prop.name]);
        propsToNotChange.forEach(prop => makeUndefined(node, prop, value));
        propsToChange.forEach(prop => {
          const propIDs = node.identifiers[prop.name];
          const propValue = prop.value.value;
          if (!propValue) {
            parent.children = prop.value;
            return;
          }
          const canMakeText =
            Object.keys(node.identifiers).length === 1 &&
            propIDs.length === 1 &&
            propIDs[0].start === 0 &&
            propIDs[0].end === node.value.length;
          propIDs.forEach(propID => {
            const isText = prop.value.expression === false;
            const content = !canMakeText && isText ? `'${String(propValue)}'` : String(propValue);
            value.overwrite(propID.start, propID.end, content);
            if (canMakeText && isText) {
              // Convert to Text.
              node.type = textName;
              delete node.identifiers;
            }
          });
          node.value = value.toString();
        });
        // 2. Dead code elimination.
        if (node.value === 'undefined') {
          // HACK: to "remove" InterpolationEscaped.
          node.value = '';
          node.type = textName;
        }
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
      enter(node, parent) {
        // 1. Inlining.
        const test = new MagicString(node.test);
        const propsToChange = props.filter(prop => prop.value && node.identifiers[prop.name]);
        const propsToNotChange = props.filter(prop => !prop.value && node.identifiers[prop.name]);
        propsToNotChange.forEach(prop => makeUndefined(node, prop, test, 'test'));
        propsToChange.forEach(prop => {
          const propIDs = node.identifiers[prop.name];
          const propValue = prop.value.value;
          if (prop.value.expression === false) {
            node.test = `"${propValue}"`;
            return;
          }
          propIDs.forEach(propID => {
            test.overwrite(propID.start, propID.end, String(propValue));
          });
          node.test = test.toString();
        });
        // 2. Dead code elimination.
        const evaluates = isTruthy(node.test);
        if (evaluates === false) {
          if (parent.type === conditionName) {
            delete parent.type;
            delete parent.test;
            delete parent.alternate;
            delete parent.consequent;
            delete parent.identifiers;
            Object.assign(parent, node.alternate);
            return;
          }
          parent.children = parent.children
            .map(child => {
              if (child === node) {
                return node.alternate;
              }
              return child;
            })
            .filter(Boolean);
          return;
        }
        if (evaluates === true) {
          parent.children = parent.children
            .map(child => {
              if (child === node) {
                return node.consequent;
              }
              return child;
            })
            .filter(Boolean);
        }
      }
    }
  });
}

// function makeReferenceSafe(node, prop, magicString, key = 'value') {
//   const propIDs = node.identifiers[prop.name];
//   propIDs.forEach(propID => {
//     const contentVar = magicString.slice(propID.start, propID.end);
//     const content = `(typeof ${contentVar} === 'undefined' ? undefined : ${contentVar})`;
//     magicString.overwrite(propID.start, propID.end, content);
//   });
//   node[key] = magicString.toString();
// }

function makeUndefined(node, prop, magicString, key = 'value') {
  const propIDs = node.identifiers[prop.name];
  propIDs.forEach(propID => {
    const content = 'undefined';
    magicString.overwrite(propID.start, propID.end, content);
  });
  node[key] = magicString.toString();
}

function isTruthy(code) {
  const bodyChild = getBodyChild(code);
  if (!bodyChild) {
    return null;
  }
  const evaluates = bodyChild.evaluateTruthy();
  return evaluates;
}

function evaluate(code) {
  const bodyChild = getBodyChild(code);
  if (!bodyChild) {
    return null;
  }
  const evaluates = bodyChild.evaluate();
  return evaluates;
}

function getBodyChild(code) {
  let bodyChild = null;
  babelTraverse(
    parse(`(${code})`),
    {
      Program(path) {
        const body = path.get('body');
        if (!body) {
          return;
        }
        bodyChild = body[0];
      }
    },
    null
  );
  return bodyChild;
}
