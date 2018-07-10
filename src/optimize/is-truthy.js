import getBodyChild from '../utils/get-body-child';

function isTruthy(code) {
  const bodyChild = getBodyChild(code);
  if (!bodyChild) {
    return null;
  }
  const evaluates = bodyChild.evaluateTruthy();
  return evaluates;
}

export default isTruthy;
