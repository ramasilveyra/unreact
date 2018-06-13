/* eslint-disable no-param-reassign */
import htmlTagsVoids from 'html-tags/void';
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

function codeGeneratorPug(node, { level = 0, previousSibling = null } = {}) {
  switch (node.type) {
    case rootName:
      return node.children.map(child => codeGeneratorPug(child, { level })).join('');
    case mixinName:
      return node.children.map(child => codeGeneratorPug(child, { level }));
    case elementName:
      return indent(
        generateTag(
          node.tagName,
          node.children
            .map((child, i) =>
              codeGeneratorPug(child, {
                level: level + 1,
                previousSibling: i > 0 ? node.children[i - 1] : null
              })
            )
            .join(''),
          node.attributes.map(child => codeGeneratorPug(child, { level: level + 1 })).join(', ')
        ),
        {
          level
        }
      );
    case textName:
      if (previousSibling && previousSibling.type === elementName) {
        return indent(`| ${node.value}`, { level });
      }
      return node.value;
    case attributeName:
      return generateProperty(node.name, node.value, node.expression);
    case interpolationEscapedName:
      if (previousSibling && previousSibling.type === elementName) {
        return indent(`| ${generateInterpolationEscaped(node.value)}`, { level });
      }
      return generateInterpolationEscaped(node.value);
    case conditionName:
      return indent(
        generateCondition(
          node.test,
          codeGeneratorPug(node.consequent, { level: level + 1 }),
          node.alternate && codeGeneratorPug(node.alternate, { level: level + 1 }),
          level + 1
        ),
        {
          level
        }
      );
    case iterationName:
      return indent(
        generateIteration({
          iterable: node.iterable,
          currentValue: node.currentValue,
          index: node.index,
          array: node.array,
          body: codeGeneratorPug(node.body, { level: level + 1 }),
          level
        }),
        {
          level
        }
      );
    default:
      throw new TypeError(node.type);
  }
}

export default codeGeneratorPug;

function generateTag(tagName, children, properties) {
  const startTag = `${tagName}${properties ? '(' : ''}${properties}${properties ? ')' : ''}`;
  if (htmlTagsVoids.includes(tagName)) {
    return startTag;
  }
  const addSpace = children && !children[0].includes('\n');
  const tag = startTag + (addSpace ? ` ${children}` : children);
  return tag;
}

function generateProperty(name, value, expression) {
  const normalizedName = normalizePropertyName(name);

  // NOTE: `value === true` is to accept boolean attributes, e.g.: `<input checked />`.
  if (value === true) {
    return normalizedName;
  }

  if (expression) {
    return `${normalizedName}=${value}`;
  }

  return `${normalizedName}="${value}"`;
}

function normalizePropertyName(name) {
  switch (name) {
    case 'className':
      return 'class';
    case 'htmlFor':
      return 'for';
    case 'tabIndex':
      return 'tabindex';
    default:
      return name;
  }
}

function generateCondition(test, consequent, alternate, level) {
  const newConsequent = consequent[0] === '\n' ? consequent : indent(consequent, { level });
  const alternateOrNull = stuff => (alternate ? stuff() : null);
  const conditionArray = [
    `if ${test}`,
    newConsequent,
    alternateOrNull(() => indent('else', { level: level - 1 })),
    alternateOrNull(() => (alternate[0] === '\n' ? alternate : indent(alternate, { level })))
  ].filter(Boolean);
  return conditionArray.join('');
}

function generateIteration({ iterable, currentValue, index, array, body, level }) {
  const params = [currentValue, index].filter(Boolean).join(', ');
  const iterationArray = [
    `each ${params} in ${iterable}`,
    array ? indent(generateScriptlet(`const ${array} = ${iterable};`), { level: level + 1 }) : null,
    body
  ].filter(Boolean);
  return iterationArray.join('');
}

function generateScriptlet(value) {
  return `- ${value}`;
}

function generateInterpolationEscaped(value) {
  return `#{${value}}`;
}

function indent(str, { level }) {
  const indentChar = ' ';
  const indentLength = 2;
  const startIndentNumber = level * indentLength;
  const isRoot = level === 0;
  const strIndented = `${isRoot ? '' : '\n'}${indentChar.repeat(startIndentNumber)}${str}${
    isRoot ? '\n' : ''
  }`;
  return strIndented;
}
