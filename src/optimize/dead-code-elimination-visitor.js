/* eslint-disable no-param-reassign */
import evaluate from './evaluate';
import isTruthy from './is-truthy';
import { conditionName, textName } from '../ast';

const deadCodeElimination = {
  Attribute: {
    exit(node, parent) {
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
        if (result.confident && ['string', 'number'].includes(typeof result.value)) {
          node.value = result.value;
          node.expression = false;
        }
      }
    }
  },
  InterpolationEscaped: {
    exit(node) {
      if (node.value === 'undefined') {
        // HACK: to "remove" InterpolationEscaped.
        node.value = '';
        node.type = textName;
      }
    }
  },
  Condition: {
    enter(node, parent) {
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
};

export default deadCodeElimination;
