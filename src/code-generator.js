import isSelfClosing from 'is-self-closing';
import { elementName, rootName, textName, EJSEscapedName } from './ast';

function codeGenerator(node) {
  switch (node.type) {
    case rootName:
      return `${node.children.map(codeGenerator).join('')}\n`;
    case elementName:
      return `${generateTag(node.tagName, node.children.map(codeGenerator).join(''))}`;
    case textName:
      return node.value;
    case EJSEscapedName:
      return `<%= ${node.value} %>`;
    default:
      throw new TypeError(node.type);
  }
}

export default codeGenerator;

function generateTag(tagName, children) {
  if (isSelfClosing(tagName)) {
    return `<${tagName} />`;
  }
  const startTag = `<${tagName}>`;
  const endTag = `</${tagName}>`;
  const tag = startTag + children + endTag;

  return tag;
}
