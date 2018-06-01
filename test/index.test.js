import fs from 'fs';
import path from 'path';
import util from 'util';
import { compile, compileDir, compileFile } from '../src/index';

describe('while using react2ejs.compile()', () => {
  it('should convert react components of one tag to ejs', async () => {
    const { input, output } = await getTestCase('one-tag');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components of multiple nested tags to ejs', async () => {
    const { input, output } = await getTestCase('nested-tags');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components of one tag with text to ejs', async () => {
    const { input, output } = await getTestCase('with-text');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components of one tag with var expression to ejs', async () => {
    const { input, output } = await getTestCase('with-var-expression');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components of one tag with complex expression to ejs', async () => {
    const { input, output } = await getTestCase('with-complex-expression');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components of a self closing tag to ejs', async () => {
    const { input, output } = await getTestCase('self-closing-tag');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with attributes to ejs', async () => {
    const { input, output } = await getTestCase('attrs');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with boolean attributes to ejs', async () => {
    const { input, output } = await getTestCase('attrs-boolean');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with var expression attributes to ejs', async () => {
    const { input, output } = await getTestCase('attrs-var-expression');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with complex expression attributes to ejs', async () => {
    const { input, output } = await getTestCase('attrs-complex-expression');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with logical expression to ejs', async () => {
    const { input, output } = await getTestCase('logical-expression');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with conditional expression to ejs', async () => {
    const { input, output } = await getTestCase('conditional-expression');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with map iterator to ejs', async () => {
    const { input, output } = await getTestCase('iterator');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components to ejs and ignore unnecessary attributes', async () => {
    const { input, output } = await getTestCase('ignore-unnecessary-attrs');
    const result = compile(input);
    expect(result).toBe(output);
  });
  it('should convert react components with logical expression inside conditional expression to ejs', async () => {
    const { input, output } = await getTestCase('logical-expr-inside-conditional-expr');
    const result = compile(input);
    expect(result).toBe(output);
  });
});

describe('while using react2ejs.compileFile()', () => {
  it('should convert react components of one tag to ejs', async () => {
    const fixture = 'compile-file';
    const inputPath = getFixturePath(`${fixture}/input.js`);
    const outputPath = getFixturePath(`${fixture}/output.ejs`);
    await compileFile(inputPath, outputPath);
    const output = await getFixture(`${fixture}/output.ejs`);
    expect(output).toMatchSnapshot();
  });
});

describe('while using react2ejs.compileDir()', () => {
  it('should convert react components of one tag to ejs', async () => {
    const fixture = 'compile-dir';
    const inputOutputPath = getFixturePath(fixture);
    await compileDir(inputOutputPath, inputOutputPath);
    const Nested = await getFixture(`${fixture}/Nested.ejs`);
    const Simple = await getFixture(`${fixture}/Simple.ejs`);
    expect(Nested).toMatchSnapshot();
    expect(Simple).toMatchSnapshot();
  });
});

async function getTestCase(folder) {
  const input = await getFixture(`${folder}/input.js`);
  const output = await getFixture(`${folder}/output.ejs`);
  return { input, output };
}

const readFileAsync = util.promisify(fs.readFile);

async function getFixture(file) {
  const filePath = getFixturePath(file);
  const fileContent = await readFileAsync(filePath, { encoding: 'utf8' });
  return fileContent;
}

function getFixturePath(file) {
  const filePath = path.resolve(__dirname, 'fixtures', file);
  return filePath;
}
