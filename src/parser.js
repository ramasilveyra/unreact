import { parse as babelParse } from '@babel/parser';

function parser(code) {
  const ast = babelParse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  return ast;
}

export default parser;
