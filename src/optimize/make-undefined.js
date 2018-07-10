/* eslint-disable no-param-reassign */
function makeUndefined(node, prop, magicString, key = 'value') {
  const propIDs = node.identifiers[prop.name];
  propIDs.forEach(propID => {
    const content = 'undefined';
    magicString.overwrite(propID.start, propID.end, content);
  });
  node[key] = magicString.toString();
}

export default makeUndefined;
