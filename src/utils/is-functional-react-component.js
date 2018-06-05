import * as t from '@babel/types';

// Note: this makes a lot of assumptions based on common conventions, it's not accurate.
export default function isFunctionalReactComponent(path) {
  const node = path.node;
  const isVariableDeclaration = t.isVariableDeclaration(node);
  const isFunctionDeclaration = t.isFunctionDeclaration(node);
  if (!isVariableDeclaration && !isFunctionDeclaration) {
    return { is: false, name: null, props: null };
  }
  const name = isVariableDeclaration ? node.declarations[0].id.name : node.id.name;
  const propsRaw = isVariableDeclaration ? getPropsRawFromVar(node) : node.params[0];
  const props = convertPropsToArray(propsRaw);
  if (isJSXElementOrReactCreateElement(path)) {
    return { is: true, name, props };
  }
  return { is: false, name: null, props: null };
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

function convertPropsToArray(propsRaw) {
  if (!propsRaw || !t.isObjectPattern(propsRaw)) {
    return null;
  }
  const props = propsRaw.properties.map(prop => prop.value.name);
  return props;
}

function getPropsRawFromVar(node) {
  const varValue = node.declarations[0].init;
  if (t.isArrowFunctionExpression(varValue)) {
    return varValue.params[0];
  }
  return false;
}
