/* eslint-disable no-param-reassign */
import htmlTagsVoids from 'html-tags/void';
import babelGenerator from '@babel/generator';
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

function codeGeneratorPug(
  node,
  { initialIndentLevel = 0, indentLevel = initialIndentLevel, previousSibling = null } = {}
) {
  switch (node.type) {
    case rootName:
      return node.children
        .map(child => codeGeneratorPug(child, { initialIndentLevel, indentLevel }))
        .join('');
    case mixinName:
      return node.children
        .map(child => codeGeneratorPug(child, { initialIndentLevel, indentLevel }))
        .join('');
    case elementName:
      return indent(
        generateTag(
          node.tagName,
          node.children
            .map((child, i) =>
              codeGeneratorPug(child, {
                initialIndentLevel,
                indentLevel: indentLevel + 1,
                previousSibling: i > 0 ? node.children[i - 1] : null
              })
            )
            .join(''),
          node.attributes
            .map(child =>
              codeGeneratorPug(child, { initialIndentLevel, indentLevel: indentLevel + 1 })
            )
            .join(', ')
        ),
        {
          initialIndentLevel,
          indentLevel
        }
      );
    case textName:
      if (previousSibling && previousSibling.type === elementName) {
        return indent(`| ${node.value}`, { initialIndentLevel, indentLevel });
      }
      return node.value;
    case attributeName:
      return generateProperty({
        name: node.name,
        isBoolean: node.isBoolean,
        isString: node.isString,
        value: node.value,
        valuePath: node.valuePath
      });
    case interpolationEscapedName:
      if (previousSibling && [elementName, conditionName].includes(previousSibling.type)) {
        return indent(`| ${generateInterpolationEscaped(node.valuePath)}`, {
          initialIndentLevel,
          indentLevel
        });
      }
      return generateInterpolationEscaped(node.valuePath);
    case conditionName:
      return indent(
        generateCondition(
          node.testPath,
          codeGeneratorPug(node.consequent, { initialIndentLevel, indentLevel: indentLevel + 1 }),
          node.alternate &&
            codeGeneratorPug(node.alternate, { initialIndentLevel, indentLevel: indentLevel + 1 }),
          initialIndentLevel,
          indentLevel + 1
        ),
        {
          initialIndentLevel,
          indentLevel
        }
      );
    case iterationName:
      return indent(
        generateIteration({
          iterablePath: node.iterablePath,
          currentValuePath: node.currentValuePath,
          indexPath: node.indexPath,
          arrayPath: node.arrayPath,
          body: codeGeneratorPug(node.body, { initialIndentLevel, indentLevel: indentLevel + 1 }),
          initialIndentLevel,
          indentLevel
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

function generateProperty({ name, isBoolean, isString, value, valuePath }) {
  const normalizedName = normalizePropertyName(name);

  if (isBoolean) {
    return normalizedName;
  }

  if (isString) {
    return `${normalizedName}="${value}"`;
  }

  const generatedValue = babelGenerator(valuePath.node, { concise: true });
  return `${normalizedName}=${generatedValue.code}`;
}

function generateCondition(testPath, consequent, alternate, initialIndentLevel, indentLevel) {
  const generatedValue = babelGenerator(testPath.node, { concise: true });
  const newConsequent = fixConsequent(consequent, initialIndentLevel, indentLevel);
  const alternateOrNull = stuff => (alternate ? stuff() : null);
  const conditionArray = [
    `if ${generatedValue.code}`,
    newConsequent,
    alternateOrNull(() => indent('else', { initialIndentLevel, indentLevel: indentLevel - 1 })),
    alternateOrNull(
      () =>
        alternate[0] === '\n' ? alternate : indent(alternate, { initialIndentLevel, indentLevel })
    )
  ].filter(Boolean);
  return conditionArray.join('');
}

function fixConsequent(consequent, initialIndentLevel, indentLevel) {
  if (consequent[0] === '\n') {
    return consequent;
  }
  if (consequent.startsWith('#{') && consequent.endsWith('}')) {
    return indent(`| ${consequent}`, { initialIndentLevel, indentLevel });
  }
  return indent(consequent, { initialIndentLevel, indentLevel });
}

function generateIteration({
  iterablePath,
  currentValuePath,
  indexPath,
  arrayPath,
  body,
  initialIndentLevel,
  indentLevel
}) {
  const iterableCode = babelGenerator(iterablePath.node, { concise: true }).code;
  const currentValueCode = currentValuePath
    ? babelGenerator(currentValuePath.node, { concise: true }).code
    : null;
  const indexCode = indexPath ? babelGenerator(indexPath.node, { concise: true }).code : null;
  const arrayCode = arrayPath ? babelGenerator(arrayPath.node, { concise: true }).code : null;
  const params = [currentValueCode, indexCode].filter(Boolean).join(', ');
  const iterationArray = [
    `each ${params} in ${iterableCode}`,
    arrayCode
      ? indent(generateScriptlet(`const ${arrayCode} = ${iterableCode};`), {
          initialIndentLevel,
          indentLevel: indentLevel + 1
        })
      : null,
    body
  ].filter(Boolean);
  return iterationArray.join('');
}

function generateScriptlet(value) {
  return `- ${value}`;
}

function generateInterpolationEscaped(valuePath) {
  const generatedValue = babelGenerator(valuePath.node, { concise: true });
  return `#{${generatedValue.code}}`;
}

function indent(str, { initialIndentLevel, indentLevel }) {
  const indentChar = ' ';
  const indentLength = 2;
  const startIndentNumber = indentLevel * indentLength;
  const isRoot = indentLevel === initialIndentLevel;
  const strIndented = `${isRoot ? '' : '\n'}${indentChar.repeat(startIndentNumber)}${str}${
    isRoot ? '\n' : ''
  }`;
  return strIndented;
}
