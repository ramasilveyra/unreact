/* eslint-disable no-param-reassign, no-underscore-dangle */
import * as t from '@babel/types';
import evaluate from './evaluate';
import isTruthy from './is-truthy';
import { conditionName, textName } from '../ast';

const deadCodeElimination = {
  Attribute: {
    exit(node, parent) {
      if (node.isBoolean || node.isString) {
        return;
      }
      if (t.isIdentifier(node.valuePath.node) && node.valuePath.node.name === 'undefined') {
        parent.attributes = parent.attributes.filter(attr => attr !== node);
        return;
      }
      const result = evaluate(node.valuePath);
      if (result.confident && ['string', 'number'].includes(typeof result.value)) {
        node.value = result.value;
        node.isString = true;
      } else if (t.isTemplateLiteral(node.valuePath.node)) {
        constantFoldingTemplateLiteral(node.valuePath);
      }
    }
  },
  InterpolationEscaped: {
    exit(node) {
      if (t.isIdentifier(node.valuePath.node, { name: 'undefined' })) {
        // HACK: to "remove" InterpolationEscaped.
        node.valuePath = null;
        node.type = textName;
        return;
      }

      if (t.isStringLiteral(node.valuePath.node)) {
        node.type = textName;
        node.value = node.valuePath.node.value;
        delete node.valuePath;
      }
    }
  },
  Condition: {
    enter(node, parent) {
      const evaluates = isTruthy(node.testPath);
      if (evaluates === false) {
        if (parent.type === conditionName) {
          delete parent.type;
          delete parent.testPath;
          delete parent.alternate;
          delete parent.consequent;
          delete parent._parent;
          delete node._parent;
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

function constantFoldingTemplateLiteral(path) {
  path.traverse({
    ConditionalExpression(nodePath) {
      const result = nodePath.evaluate();
      if (result.confident && typeof result.value === 'string') {
        const nodeStart = nodePath.node.start;
        const nodeIndex = nodePath.parent.expressions.findIndex(expr => expr === nodePath.node);
        nodePath.parent.quasis = nodePath.parent.quasis.map(q => {
          const placeholdersStart = 2; // placeholders start symbols length "${".
          if (q.end === nodeStart - placeholdersStart) {
            q.value.cooked += result.value;
            q.value.raw += result.value;
          }
          return q;
        });
        nodePath.remove();
        const quasiExtra = nodePath.parentPath.get(`quasis.${nodeIndex + 1}`);
        const quasiExtraValue = quasiExtra.node.value.cooked;
        quasiExtra.remove();
        const quasiBefore = nodePath.parentPath.get(`quasis.${nodeIndex}`);
        quasiBefore.node.value.cooked += quasiExtraValue;
        quasiBefore.node.value.raw += quasiExtraValue;
      }
    }
  });
}
