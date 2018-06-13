import codeGeneratorPug from '../src/code-generator-pug';

describe('while using Pug code generator', () => {
  it('should throw with not valid AST node type', () => {
    expect(() => codeGeneratorPug({ type: 'FOO' })).toThrow();
  });
});
