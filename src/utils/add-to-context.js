/* eslint-disable no-param-reassign */
import { rootName, elementName, conditionName, iterationName, mixinName } from '../ast';

export default function addToContext(context, node, member) {
  if (member) {
    addNode(context, node, member);
    return;
  }
  switch (context.type) {
    case rootName:
    case elementName:
    case mixinName:
      addNode(context, node, 'children');
      break;
    case iterationName:
      addNode(context, node, 'body');
      break;
    case conditionName:
      if (context.consequent) {
        addNode(context, node, 'alternate');
      } else {
        addNode(context, node, 'consequent');
      }
      break;
    default:
      throw new Error(`Don't know how to add node to ${context.type}`);
  }
}

function addNode(context, node, member) {
  if (Array.isArray(context[member])) {
    context[member].push(node);
    return;
  }
  context[member] = node;
}
