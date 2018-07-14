/* eslint-disable no-param-reassign */
import htmlTagsVoids from 'html-tags/void';
import * as t from '@babel/types';
import babelTraverse from '@babel/traverse';
import parse from './parser';
import {
  attributeName,
  conditionName,
  elementName,
  interpolationEscapedName,
  iterationName,
  mixinName,
  rootName,
  textName
} from './ast';
import normalizePropertyName from './utils/normalize-property-name';
import getBodyChild from './utils/get-body-child';

function codeGeneratorEjs(node, { initialIndentLevel = 0, indentLevel = initialIndentLevel } = {}) {
  switch (node.type) {
    case rootName:
      return node.children
        .map(child => codeGeneratorEjs(child, { initialIndentLevel, indentLevel }))
        .join('');
    case mixinName:
      return node.children
        .map(child => codeGeneratorEjs(child, { initialIndentLevel, indentLevel }))
        .join('');
    case elementName:
      return indent(
        generateTag(
          node.tagName,
          node.children
            .map(child =>
              codeGeneratorEjs(child, { initialIndentLevel, indentLevel: indentLevel + 1 })
            )
            .join(''),
          node.attributes
            .map(child =>
              codeGeneratorEjs(child, { initialIndentLevel, indentLevel: indentLevel + 1 })
            )
            .join('')
        ),
        {
          initialIndentLevel,
          indentLevel
        }
      );
    case textName:
      return node.value;
    case attributeName:
      return generateProperty(node.name, node.value, node.expression);
    case interpolationEscapedName:
      return generateInterpolationEscaped(node.value);
    case conditionName:
      return indent(
        generateCondition(
          node.test,
          codeGeneratorEjs(node.consequent, { initialIndentLevel, indentLevel: indentLevel + 1 }),
          node.alternate &&
            codeGeneratorEjs(node.alternate, { initialIndentLevel, indentLevel: indentLevel + 1 })
        ),
        {
          initialIndentLevel,
          indentLevel
        }
      );
    case iterationName:
      return indent(
        generateIteration({
          iterable: node.iterable,
          currentValue: node.currentValue,
          index: node.index,
          array: node.array,
          body: codeGeneratorEjs(node.body, { initialIndentLevel, indentLevel: indentLevel + 1 })
        }),
        {
          initialIndentLevel,
          indentLevel
        }
      );
    default:
      throw new TypeError(node.type);
  }
}

export default codeGeneratorEjs;

function generateTag(tagName, children, properties) {
  const startTagBeginning = `<${tagName}${properties}`;
  if (htmlTagsVoids.includes(tagName)) {
    return `${startTagBeginning} />`;
  }
  const startTag = `${startTagBeginning}>`;
  const endTag = `</${tagName}>`;
  const tag = startTag + children + endTag;

  return tag;
}

function generateProperty(name, value, expression) {
  const normalizedName = normalizePropertyName(name);
  const startPropertyBeginning = ` ${normalizedName}`;

  // NOTE: `value === true` is to accept boolean attributes, e.g.: `<input checked />`.
  if (value === true) {
    return startPropertyBeginning;
  }

  if (expression) {
    // TODO: property nodes that are expressions should have the babel ast so `isNullOrUndefined()` or `isString()` doesn't need to parse again.
    const resultNullOrUndefined = isNullOrUndefined(value);
    const resultString = isString(value);
    const propertyInterpolated = `${startPropertyBeginning}="${generateInterpolationEscaped(
      value
    )}"`;
    if (!resultString && resultNullOrUndefined) {
      return `${generateScriptlet(
        `if (![null,undefined].includes(${value})) {`
      )}${propertyInterpolated}${generateScriptlet('}')}`;
    }
    return propertyInterpolated;
  }

  return `${startPropertyBeginning}="${value}"`;
}

function generateCondition(test, consequent, alternate) {
  const conditionArray = [
    generateScriptlet(`if (${test}) {`),
    consequent,
    alternate ? generateScriptlet('} else {') : null,
    alternate,
    generateScriptlet('}')
  ].filter(Boolean);
  return conditionArray.join('');
}

function generateIteration({ iterable, currentValue, index, array, body }) {
  const params = [currentValue, index, array].filter(Boolean).join(', ');
  const iterationArray = [
    generateScriptlet(`${iterable}.forEach((${params}) => {`),
    body,
    generateScriptlet('})')
  ].filter(Boolean);
  return iterationArray.join('');
}

function generateScriptlet(value) {
  return `<% ${value} %>`;
}

function generateInterpolationEscaped(value) {
  return `<%= ${value} %>`;
}

function indent(str, { initialIndentLevel, indentLevel }) {
  const indentChar = ' ';
  const indentLength = 2;
  const startIndentNumber = indentLevel * indentLength;
  const endIndentNumber = (indentLevel ? indentLevel - 1 : indentLevel) * indentLength;
  const strIndented = `${indentLevel === initialIndentLevel ? '' : '\n'}${indentChar.repeat(
    startIndentNumber
  )}${str}${'\n'}${indentChar.repeat(endIndentNumber)}`;
  return strIndented;
}

function isNullOrUndefined(code) {
  const bodyChild = getBodyChild(code);
  if (!bodyChild) {
    return true;
  }
  const evaluates = bodyChild.evaluate();
  if (evaluates.confident) {
    const result = [null, undefined].includes(evaluates.value);
    return result;
  }
  return true;
}

function isString(code) {
  const ast = parse(`(${code})`);
  let is = false;
  babelTraverse(
    ast,
    {
      Program(path) {
        const body = path.get('body');
        if (!body) {
          return;
        }
        const bodyChild = body[0];
        if (t.isTemplateLiteral(bodyChild.node.expression)) {
          is = true;
        }
      },
      BinaryExpression(path) {
        if (path.node.operator !== '+') {
          return;
        }
        const nodeLeft = path.node.left;
        const nodeRight = path.node.right;
        if (
          t.isTaggedTemplateExpression(nodeLeft) ||
          t.isStringLiteral(nodeLeft) ||
          t.isTemplateLiteral(nodeLeft) ||
          t.isTaggedTemplateExpression(nodeRight) ||
          t.isStringLiteral(nodeRight) ||
          t.isTemplateLiteral(nodeRight)
        ) {
          is = true;
        }
      }
    },
    null
  );
  return is;
}
