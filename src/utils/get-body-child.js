import babelTraverse from '@babel/traverse';
import parse from '../parser';

function getBodyChild(code) {
  let bodyChild = null;
  babelTraverse(
    parse(`(${code})`),
    {
      Program(path) {
        const body = path.get('body');
        if (!body) {
          return;
        }
        bodyChild = body[0];
      }
    },
    null
  );
  return bodyChild;
}

export default getBodyChild;
