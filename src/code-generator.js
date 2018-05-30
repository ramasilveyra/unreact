import isSelfClosing from 'is-self-closing';
import { elementName, rootName, textName, attributeName, templateEscapedName } from './ast';

function codeGenerator(node) {
  switch (node.type) {
    case rootName:
      return `${node.children.map(codeGenerator).join('')}\n`;
    case elementName:
      return `${generateTag(
        node.tagName,
        node.children.map(codeGenerator).join(''),
        node.attributes.map(codeGenerator).join('')
      )}`;
    case textName:
      return node.value;
    case attributeName:
      return generateProperty(node.name, node.value, node.expression);
    case templateEscapedName:
      return `<%= ${node.value} %>`;
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
    return `${startPropertyBeginning}="<%= ${value} %>"`;
  }

  return `${startPropertyBeginning}="${value}"`;
}

function normalizePropertyName(name) {
  switch (name) {
    case 'className':
      return 'class';
    case 'tabIndex':
      return 'tabindex';
    default:
      return name;
  }
}
