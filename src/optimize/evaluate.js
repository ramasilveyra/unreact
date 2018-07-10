import getBodyChild from '../utils/get-body-child';

function evaluate(code) {
  const bodyChild = getBodyChild(code);
  if (!bodyChild) {
    return null;
  }
  const evaluates = bodyChild.evaluate();
  return evaluates;
}

export default evaluate;
