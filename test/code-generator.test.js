import EJSCodeGenerator from '../src/code-generator';

describe('while using EJS code generator', () => {
  it('should throw with not valid AST node type', () => {
    expect(() => EJSCodeGenerator({ type: 'FOO' })).toThrow();
  });
});
