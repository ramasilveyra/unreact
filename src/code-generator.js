/* eslint-disable no-param-reassign */
import htmlTags from 'html-tags';
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

function ejsCompilerBackend(ast, reactComponentsTable) {
  const optimizedAST = optimize(ast, reactComponentsTable);
  const code = codeGenerator(optimizedAST);
  return code;
}

function optimize(ast, reactComponentsTable) {
  traverser(ast, {
    Element: {
      exit(node) {
        const isRC = !htmlTags.includes(node.tagName);
        if (isRC) {
          const children = node.children;
          const componentNode = Object.assign({}, reactComponentsTable[node.tagName].node);
          removeNode(
            reactComponentsTable[node.tagName].parent,
            reactComponentsTable[node.tagName].node
          );
          if (children.length) {
            componentNode.children[0].children = children;
          }
          Object.assign(node, componentNode);
          delete node.tagName;
          delete node.attributes;
        }
      }
    }
  });
  return ast;
}

function codeGenerator(node, level = 0, removeEmptyLine = false) {
  switch (node.type) {
    case rootName:
      return node.children.map((child, i) => codeGenerator(child, level, i === 0)).join('');
    case mixinName:
      return node.children.map(child => codeGenerator(child, level, removeEmptyLine));
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

export default ejsCompilerBackend;

function removeNode(parent, node) {
  switch (node.type) {
    case rootName:
    case elementName:
    case mixinName:
      node.children = node.children.filter(child => child === node);
      break;
    default:
      throw new TypeError(node.type);
  }
}

function traverser(ast, visitor) {
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node, parent) {
    const method = visitor[node.type];

    if (method && method.enter) {
      method.enter(node, parent);
    }

    switch (node.type) {
      case rootName:
      case mixinName:
        traverseArray(node.children, node);
        break;
      case elementName:
        traverseArray(node.children, node);
        traverseArray(node.attributes, node);
        break;
      case conditionName:
        traverseNode(node.consequent, node);
        if (node.alternate) {
          traverseNode(node.alternate, node);
        }
        break;
      case iterationName:
        traverseNode(node.body, node);
        break;
      case textName:
      case attributeName:
      case interpolationEscapedName:
        break;
      default:
        throw new TypeError(node.type);
    }

    if (method && method.exit) {
      method.exit(node, parent);
    }
  }

  traverseNode(ast, null);
}

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
