import isFunctionalReactComponent from '../src/utils/is-functional-react-component';
import addToContext from '../src/utils/add-to-context';

describe('while using utils', () => {
  it(`addToContext() should throw if doesn't know how to add node to extraneous context type`, () => {
    expect(() => addToContext({ type: 'IVALID' }, {})).toThrow();
  });
  it(`isFunctionalReactComponent() should return false with non valid react component node`, () => {
    expect(isFunctionalReactComponent({ node: null })).toMatchObject({ is: false, name: null });
  });
});
