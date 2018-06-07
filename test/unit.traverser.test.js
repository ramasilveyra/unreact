import traverser from '../src/traverser';

describe('while using traverser()', () => {
  it('should throw an error with invalid node AST', () => {
    const ast = { type: 'INVALID' };
    expect(() => traverser(ast, { INVALID: { exit() {} } })).toThrow();
  });
});
