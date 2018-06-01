import isSelfClosing from 'is-self-closing';
import {
  elementName,
  rootName,
  textName,
  attributeName,
  interpolationEscapedName,
  conditionName,
  iterationName
} from './ast';

function codeGenerator(node, level = 0, removeEmptyLine = false) {
  switch (node.type) {
    case rootName:
      return node.children.map((child, i) => codeGenerator(child, level, i === 0)).join('');
    case elementName:
      return indent(
        generateTag(
          node.tagName,
          node.children.map(child => codeGenerator(child, level + 1, removeEmptyLine)).join(''),
          node.attributes.map(child => codeGenerator(child, level + 1, removeEmptyLine)).join('')
        ),
        level,
        removeEmptyLine
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
          codeGenerator(node.consequent, level + 1, removeEmptyLine),
          node.alternate && codeGenerator(node.alternate, level + 1, removeEmptyLine)
        ),
        level,
        removeEmptyLine
      );
    case iterationName:
      return indent(
        generateIteration({
          iterable: node.iterable,
          currentValue: node.currentValue,
          index: node.index,
          array: node.array,
          body: codeGenerator(node.body, level + 1, removeEmptyLine)
        }),
        level,
        removeEmptyLine
      );
    default:
      throw new TypeError(node.type);
  }
}

export default codeGenerator;

function generateTag(tagName, children, properties) {
  const startTagBeginning = `<${tagName}${properties}`;
  if (isSelfClosing(tagName)) {
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
    return `${startPropertyBeginning}="${generateInterpolationEscaped(value)}"`;
  }

  return `${startPropertyBeginning}="${value}"`;
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

function indent(str, level, removeEmptyLine) {
  const indentChar = ' ';
  const indentLength = 2;
  const startIndentNumber = level * indentLength;
  const endIndentNumber = (level ? level - 1 : level) * indentLength;
  const strIndented = `${removeEmptyLine && level === 0 ? '' : '\n'}${indentChar.repeat(
    startIndentNumber
  )}${str}${'\n'}${indentChar.repeat(endIndentNumber)}`;
  return strIndented;
}
