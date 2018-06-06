import * as t from '@babel/types';

export default function getReactComponentProps(node) {
  const isVariableDeclaration = t.isVariableDeclaration(node);
  const propsRaw = isVariableDeclaration ? getPropsRawFromVar(node) : node.params[0];
  const props = convertPropsToArray(propsRaw);
  return props;
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
