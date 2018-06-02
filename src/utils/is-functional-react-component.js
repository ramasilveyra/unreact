import * as t from '@babel/types';

// Note: this makes a lot of assumptions based on common conventions, it's not accurate.
function isFunctionalReactComponent(path) {
  const node = path.node;
  const isVariableDeclaration = t.isVariableDeclaration(node);
  const isFunctionDeclaration = t.isFunctionDeclaration(node);
  if (!isVariableDeclaration && !isFunctionDeclaration) {
    return { is: false, name: null };
  }
  const name = isVariableDeclaration ? node.declarations[0].id.name : node.id.name;
  if (isJSXElementOrReactCreateElement(path)) {
    return { is: true, name };
  }
  return { is: false, name: null };
}

function isJSXElementOrReactCreateElement(path) {
  let visited = false;

  path.traverse({
    JSXElement() {
      visited = true;
    }
  });

  return visited;
}

export default isFunctionalReactComponent;
