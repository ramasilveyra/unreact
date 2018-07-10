/* eslint-disable no-param-reassign */
import MagicString from 'magic-string';
import makeUndefined from './make-undefined';
import { textName } from '../ast';

function inlining(props) {
  return {
    Attribute: {
      exit(node) {
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
      }
    },
    InterpolationEscaped: {
      exit(node, parent) {
        const value = new MagicString(node.value);
        const propsToChange = props.filter(prop => prop.value && node.identifiers[prop.name]);
        const propsToNotChange = props.filter(prop => !prop.value && node.identifiers[prop.name]);
        propsToNotChange.forEach(prop => makeUndefined(node, prop, value));
        propsToChange.forEach(prop => {
          if (prop.name === 'children') {
            const position = parent.children.findIndex(child => child.value === 'children');
            parent.children = [
              ...parent.children.slice(0, position),
              ...prop.value,
              ...parent.children.slice(position + 1)
            ];
            return;
          }
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
              // Convert to Text.
              node.type = textName;
              delete node.identifiers;
            }
          });
          node.value = value.toString();
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
      enter(node) {
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
      }
    }
  };
}

export default inlining;
