import * as t from '@babel/types';

function getFirstMemberExpression(path) {
  let firstMemberExpressionPath = path;
  while (
    t.isMemberExpression(firstMemberExpressionPath) ||
    t.isCallExpression(firstMemberExpressionPath)
  ) {
    const objectPath = firstMemberExpressionPath.get('object');
    const calleePath = firstMemberExpressionPath.get('callee');
    if (objectPath.node) {
      firstMemberExpressionPath = objectPath;
    }
    if (calleePath.node) {
      firstMemberExpressionPath = calleePath;
    }
  }
  return firstMemberExpressionPath;
}

export default getFirstMemberExpression;
