/* eslint-disable no-param-reassign */
import htmlTagsVoids from 'html-tags/void';
import * as t from '@babel/types';
import isBooleanAttr from './utils/is-boolean-attr';
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

function codeGeneratorLiquid(
  node,
  { initialIndentLevel = 0, indentLevel = initialIndentLevel, replaceLocals = {} } = {}
) {
  switch (node.type) {
    case rootName:
      return node.children
        .map(child =>
          codeGeneratorLiquid(child, { initialIndentLevel, indentLevel, replaceLocals })
        )
        .join('');
    case mixinName:
      return node.children
        .map(child =>
          codeGeneratorLiquid(child, { initialIndentLevel, indentLevel, replaceLocals })
        )
        .join('');
    case elementName:
      return indent(
        generateTag(
          node.tagName,
          node.children
            .map(child =>
              codeGeneratorLiquid(child, {
                initialIndentLevel,
                indentLevel: indentLevel + 1,
                replaceLocals
              })
            )
            .join(''),
          node.attributes
            .map(child =>
              codeGeneratorLiquid(child, {
                initialIndentLevel,
                indentLevel: indentLevel + 1,
                replaceLocals
              })
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
        replaceLocals
      });
    case interpolationEscapedName:
      return generateInterpolationEscaped(node.valuePath, replaceLocals, true);
    case conditionName:
      return indent(
        generateCondition(
          node.testPath,
          codeGeneratorLiquid(node.consequent, {
            initialIndentLevel,
            indentLevel: indentLevel + 1,
            replaceLocals
          }),
          node.alternate &&
            codeGeneratorLiquid(node.alternate, {
              initialIndentLevel,
              indentLevel: indentLevel + 1,
              replaceLocals
            }),
          replaceLocals
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
          body: codeGeneratorLiquid(node.body, {
            initialIndentLevel,
            indentLevel: indentLevel + 1,
            replaceLocals: {
              [node.indexPath && node.indexPath.node.name]: 'forloop.index0',
              [node.arrayPath && node.arrayPath.node.name]:
                node.iterablePath && node.iterablePath.node.name
            }
          })
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

export default codeGeneratorLiquid;

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

function generateProperty({ name, isBoolean, isString, value, valuePath, replaceLocals }) {
  const normalizedName = normalizePropertyName(name);
  const startPropertyBeginning = ` ${normalizedName}`;

  if (isBoolean) {
    return startPropertyBeginning;
  }

  // NOTE: `value === true` is to accept boolean attributes, e.g.: `<input checked />`.
  if (isString) {
    return `${startPropertyBeginning}="${value}"`;
  }

  const isBoolean2 = isBooleanAttr(name);
  // console.log('isBoolean attr', name, isBoolean);
  if (isBoolean2) {
    // console.dir(value);
    const condition = generateCondition(value, normalizedName, undefined, replaceLocals);
    return ` ${condition}`;
  }

  return `${startPropertyBeginning}="${generateInterpolationEscaped(
    valuePath,
    replaceLocals,
    true
  )}"`;
}

function generateCondition(path, consequent, alternate, replaceLocals) {
  let node = path.node;
  let block = 'if';

  if (
    node.type === 'UnaryExpression' &&
    node.operator === '!' &&
    node.argument &&
    node.argument.type === 'Identifier'
  ) {
    node = node.argument;
    block = 'unless';
  }

  const testCondition = generateInterpolationEscaped(path, replaceLocals, false);

  const conditionArray = [
    generateScriptlet(`${block} ${testCondition}`),
    consequent,
    alternate ? generateScriptlet('else') : null,
    alternate,
    generateScriptlet(`end${block}`)
  ].filter(Boolean);
  return conditionArray.join('');
}

function generateIteration({ iterablePath, currentValuePath, body }) {
  // const params = [currentValue, index, array].filter(Boolean).join(', ');
  const iterableNode = iterablePath.node;
  let initializator = '';
  let iterable = iterablePath.node.name;

  if (
    iterableNode.type === 'ArrayExpression' &&
    iterableNode.elements.every(e => e.type === 'StringLiteral')
  ) {
    const joinedValues = iterableNode.elements.map(e => e.value).join('|');
    initializator = generateScriptlet(`assign iterator = "${joinedValues}" | split: '|'`);
    iterable = 'iterator';
  }

  const iterationArray = [
    initializator,
    generateScriptlet(`for ${currentValuePath.node.name} in ${iterable}`),
    body,
    generateScriptlet('endfor')
  ].filter(Boolean);
  return iterationArray.join('');
}

function generateScriptlet(value) {
  return `{% ${value} %}`;
}

const methodToFilter = {
  join: 'join',
  toUpperCase: 'upcase',
  toLowerCase: 'downcase',
  replace: 'replace',
  trim: 'strip',
  // slice defaults to 1.
  charAt: 'slice',
  // javascript "slice" is different to liquid "slice"
  substr: 'slice',

  // special case, we change the second argument
  slice: 'slice'
};

const propertyTranslation = {
  length: 'size'
};

/**
 *
 * @param {String|esprima.expression} expression the expression to interpolate
 * @param {Object} replaceLocals A key-value map of variables to replace name. Used in the for-each case.
 * @param {boolean} final indicates if the expression needs to be wrapped
 */
function generateInterpolationEscaped(path, replaceLocals, final) {
  const node = path.node;
  const wrap = v => (final ? `{{ ${v} }}` : v);

  switch (node.type) {
    case 'Literal':
    case 'StringLiteral':
    case 'NumericLiteral':
      if (!final && typeof node.value === 'string') {
        return `"${node.value}"`;
      }
      return node.value;
    case 'UnaryExpression':
      return generateInterpolationEscaped(path.get('argument'), replaceLocals, false);
    case 'Identifier':
      return wrap(replaceLocals[node.name] || node.name);
    case 'MemberExpression': {
      const left = generateInterpolationEscaped(node.object, replaceLocals, false);
      const property =
        (node.property.type === 'Literal' && propertyTranslation[node.property.name]) ||
        node.property;
      const right = generateInterpolationEscaped(property, {}, false);
      return wrap(`${left}.${right}`);
    }
    case 'BinaryExpression': {
      const finalLeafs = node.operator !== '-';
      const left = generateInterpolationEscaped(path.get('left'), replaceLocals, finalLeafs);
      const right = generateInterpolationEscaped(path.get('right'), replaceLocals, finalLeafs);
      if (!final) {
        throw new Error(
          `Unsupported BinaryExpression placed inside another node between ${left} and ${right}`
        );
      }
      switch (node.operator) {
        case '+': {
          return `${left}${right}`;
        }
        case '-': {
          return wrap(`${left} | minus: ${right}`);
        }
        default:
          throw new Error(`Unsupported binary expression ${node.operator}`);
      }
    }
    case 'CallExpression': {
      if (
        node.callee.type !== 'MemberExpression' ||
        !node.callee.property ||
        !methodToFilter[node.callee.property.name]
      ) {
        const shown = (node.callee.property && node.callee.property.name) || node.callee.name;
        throw new Error(`Unsupported CallExpression "${shown}"`);
      }

      const object = generateInterpolationEscaped(path.get('callee.object'), replaceLocals, false);

      // re-consider this
      // if (!final) {
      //   throw new Error(`Unsupported CallExpression inside another expression ${object}`);
      // }

      const jsMethod = node.callee.property.name;
      const filterName = methodToFilter[jsMethod];
      if (node.arguments.length === 0) {
        return wrap(`${object} | ${filterName}`);
      }

      if (jsMethod === 'slice') {
        formatSliceArguments(path, object);
      }

      const args = node.arguments
        .map((arg, i) => {
          if (t.isMemberExpression(arg)) {
            return `${arg.object.name}.${arg.property.name}`;
          }
          return generateInterpolationEscaped(path.get(`arguments.${i}`), replaceLocals, false);
        })
        .join(', ');

      return wrap(`${object} | ${filterName}: ${args}`);
    }
    case 'LogicalExpression': {
      let operator;
      switch (node.operator) {
        case '&&':
          operator = 'and';
          break;
        case '||':
          operator = 'or';
          break;
        default:
          throw new Error(`unsupported logic operand ${node.operator}`);
      }
      // liquid does not support parenthesis for operator precedence.
      // something like a && (b || c) needs to be expressed in nested ifs.
      const supportedTypes = ['Identifier', 'Literal', 'StringLiteral'];
      if (!supportedTypes.includes(node.left.type) || !supportedTypes.includes(node.right.type)) {
        throw new Error(
          `unsupported logic operation between ${node.left.type} and ${node.right.type}`
        );
      }
      const left = generateInterpolationEscaped(path.get('left'), replaceLocals, false);
      const right = generateInterpolationEscaped(path.get('right'), replaceLocals, false);
      return wrap(`${left} ${operator} ${right}`);
    }
    // case 'ArrayExpression': {
    //   if (!node.elements.every(el => el.type === 'Literal')) {
    //     throw new Error(`unsupported ArrayExpression ${node.elements.map(e => e.type).join(',')}`);
    //   }
    //   return node.elements.map(e => e.value).join('|')
    // }
    case 'TemplateLiteral':
      return node.quasis
        .map((q, index) => {
          if (q.tail) {
            return q.value.raw;
          }
          return `${q.value.raw}${generateInterpolationEscaped(
            path.get(`expressions.${index}`),
            replaceLocals,
            true
          )}`;
        })
        .join('');
    case 'ConditionalExpression':
      return generateCondition(
        path.get('test'),
        generateInterpolationEscaped(path.get('consequent'), replaceLocals, true),
        node.alternate && generateInterpolationEscaped(path.get('alternate'), replaceLocals, true),
        replaceLocals
      );
    default:
      throw new Error(`unsupported expression ${node.type}`);
  }
}

function formatSliceArguments(path, object) {
  const expression = path.node;
  const args = expression.arguments;

  if (args.length === 2 && args[0].type === 'NumericLiteral' && args[1].type === 'NumericLiteral') {
    args[1].value -= args[0].value;
    args[1].raw = args[1].value.toString();
  } else if (
    args.length === 1 &&
    args[0].type === 'NumericLiteral' &&
    expression.callee.object.type === 'Identifier'
  ) {
    const newArg = t.memberExpression(t.identifier(object), t.identifier('size'));
    path.pushContainer('arguments', newArg);
  } else {
    throw new Error(
      'Unsupported case of "slice" method. Note: slice is different in liquid than in js'
    );
  }
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
