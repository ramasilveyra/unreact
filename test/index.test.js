import fs from 'fs';
import path from 'path';
import util from 'util';
import { compile } from '../src/index';

describe('while using react2ejs', () => {
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
});

async function getTestCase(folder) {
  const input = await getFixture(`${folder}/input.js`);
  const output = await getFixture(`${folder}/output.ejs`);
  return { input, output };
}

const readFileAsync = util.promisify(fs.readFile);

async function getFixture(file) {
  const filePath = path.resolve(__dirname, 'fixtures', file);
  const fileContent = await readFileAsync(filePath, { encoding: 'utf8' });
  return fileContent;
}
