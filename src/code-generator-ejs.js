/* eslint-disable no-param-reassign */
import htmlTagsVoids from 'html-tags/void';
import * as t from '@babel/types';
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
import getFirstMemberExpression from './utils/get-first-member-expression';

function codeGeneratorEjs(
  node,
  { initialIndentLevel = 0, indentLevel = initialIndentLevel, scope = [] } = {}
) {
  switch (node.type) {
    case rootName:
      return node.children
        .map(child => codeGeneratorEjs(child, { initialIndentLevel, indentLevel, scope }))
        .join('');
    case mixinName:
      return node.children
        .map(child => codeGeneratorEjs(child, { initialIndentLevel, indentLevel, scope }))
        .join('');
    case elementName:
      return indent(
        generateTag(
          node.tagName,
          node.children
            .map(child =>
              codeGeneratorEjs(child, { initialIndentLevel, indentLevel: indentLevel + 1, scope })
            )
            .join(''),
          node.attributes
            .map(child =>
              codeGeneratorEjs(child, { initialIndentLevel, indentLevel: indentLevel + 1, scope })
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
      return generateProperty({
        name: node.name,
        isBoolean: node.isBoolean,
        isString: node.isString,
        value: node.value,
        valuePath: node.valuePath,
        isRequired: node.isRequired,
        scope
      });
    case interpolationEscapedName:
      return generateInterpolationEscaped(node.valuePath, scope);
    case conditionName:
      return indent(
        generateCondition(
          node.testPath,
          codeGeneratorEjs(node.consequent, {
            initialIndentLevel,
            indentLevel: indentLevel + 1,
            scope
          }),
          node.alternate &&
            codeGeneratorEjs(node.alternate, {
              initialIndentLevel,
              indentLevel: indentLevel + 1,
              scope
            }),
          scope
        ),
        {
          initialIndentLevel,
          indentLevel
        }
      );
    case iterationName: {
      const params = getIterationParams(node.currentValuePath, node.indexPath, node.arrayPath);
      return indent(
        generateIteration({
          iterablePath: node.iterablePath,
          params,
          body: codeGeneratorEjs(node.body, {
            initialIndentLevel,
            indentLevel: indentLevel + 1,
            scope: scope.concat(params)
          }),
          scope
        }),
        {
          initialIndentLevel,
          indentLevel
        }
      );
    }
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

function generateProperty({ name, isBoolean, isString, value, valuePath, isRequired, scope }) {
  const normalizedName = normalizePropertyName(name);
  const startPropertyBeginning = ` ${normalizedName}`;

  if (isBoolean) {
    return startPropertyBeginning;
  }

  if (isString) {
    return `${startPropertyBeginning}="${value}"`;
  }

  makeReferenceSafe(valuePath, scope);
  const generatedValue = babelGenerator(valuePath.node, { concise: true });
  const resultString = resolvesToString(valuePath);
  const propertyInterpolated = `${startPropertyBeginning}="${generateInterpolationEscaped(
    valuePath,
    scope
  )}"`;
  if (!resultString && !isRequired) {
    return `${generateScriptlet(
      `if (![null,undefined].includes(${generatedValue.code})) {`
    )}${propertyInterpolated}${generateScriptlet('}')}`;
  }
  return propertyInterpolated;
}

function generateCondition(testPath, consequent, alternate, scope) {
  makeReferenceSafe(testPath, scope);
  const generatedValue = babelGenerator(testPath.node, { concise: true });
  const conditionArray = [
    generateScriptlet(`if (${generatedValue.code}) {`),
    consequent,
    alternate ? generateScriptlet('} else {') : null,
    alternate,
    generateScriptlet('}')
  ].filter(Boolean);
  return conditionArray.join('');
}

function generateIteration({ iterablePath, params, body, scope }) {
  makeReferenceSafe(iterablePath, scope);
  const iterableCode = babelGenerator(iterablePath.node, { concise: true }).code;
  const paramsCode = params.join(', ');
  const iterationArray = [
    generateScriptlet(`${iterableCode}.forEach((${paramsCode}) => {`),
    body,
    generateScriptlet('})')
  ].filter(Boolean);
  return iterationArray.join('');
}

function getIterationParams(currentValuePath, indexPath, arrayPath) {
  const currentValueCode = currentValuePath
    ? babelGenerator(currentValuePath.node, { concise: true }).code
    : null;
  const indexCode = indexPath ? babelGenerator(indexPath.node, { concise: true }).code : null;
  const arrayCode = arrayPath ? babelGenerator(arrayPath.node, { concise: true }).code : null;
  const params = [currentValueCode, indexCode, arrayCode].filter(Boolean);
  return params;
}

function generateScriptlet(value) {
  return `<% ${value} %>`;
}

function generateInterpolationEscaped(valuePath, scope) {
  makeReferenceSafe(valuePath, scope);
  const generatedValue = babelGenerator(valuePath.node, { concise: true });
  return `<%= ${generatedValue.code} %>`;
}

function makeReferenceSafe(path, scope) {
  if (t.isIdentifier(path)) {
    referenceSafeReplacement(scope, path);
    return;
  }

  if (t.isMemberExpression(path)) {
    const pathFirst = getFirstMemberExpression(path);
    if (pathFirst.node.name === 'locals') {
      return;
    }
    referenceSafeReplacement(scope, pathFirst);
  }

  path.traverse({
    Identifier(path1) {
      if (t.isMemberExpression(path1.parent) || t.isObjectProperty(path1.parent)) {
        return;
      }
      referenceSafeReplacement(scope, path1);
    },
    MemberExpression(path1) {
      if (t.isMemberExpression(path1.parent)) {
        return;
      }
      const pathFirst = getFirstMemberExpression(path1);
      if (pathFirst.node.name === 'locals') {
        return;
      }
      referenceSafeReplacement(scope, pathFirst);
    }
  });
}

function referenceSafeReplacement(scope, path) {
  const isFromScope = !!scope.find(scopeVar => scopeVar === path.node.name);
  if (isFromScope) {
    return;
  }
  path.replaceWith(t.memberExpression(t.identifier('locals'), path.node));
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

function resolvesToString(path) {
  if (t.isTemplateLiteral(path.node)) {
    return true;
  }
  if (
    t.isConditionalExpression(path.node) &&
    t.isStringLiteral(path.node.consequent) &&
    t.isStringLiteral(path.node.alternate)
  ) {
    return true;
  }
  if (t.isBinaryExpression(path.node) && path.node.operator === '+') {
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
      return true;
    }
  }
  return false;
}
