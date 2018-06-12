import codeGeneratorEJS from '../src/code-generator-ejs';

describe('while using EJS code generator', () => {
  it('should throw with not valid AST node type', () => {
    expect(() => codeGeneratorEJS({ type: 'FOO' })).toThrow();
  });
});
