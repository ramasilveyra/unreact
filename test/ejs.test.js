import { codeGenerator } from '../src/ejs';

describe('while using EJS code generator', () => {
  it('should throw with not valid AST node type', () => {
    expect(() => codeGenerator({ type: 'FOO' })).toThrow();
  });
});
