import * as t from '@babel/types';

export default function getReactComponentName(node) {
  const isVariableDeclaration = t.isVariableDeclaration(node);
  const isFunctionDeclaration = t.isFunctionDeclaration(node);
  const nameVariable = isVariableDeclaration && node.declarations[0].id.name;
  const nameFunction = isFunctionDeclaration && node.id.name;
  const name = nameVariable || nameFunction;
  return name;
}
