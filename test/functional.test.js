import fs from 'fs';
import util from 'util';
import path from 'path';
import { compile, compileDir, compileFile } from '../src/index';

const readFile = util.promisify(fs.readFile);

fixturesTester({
  testSuiteTitle: 'while using unreact.compile()',
  fixturesDir: path.join(__dirname, 'fixtures', 'compile'),
  generateTest: async ({ fixtureDir }) => {
    const jsCodePath = path.join(fixtureDir, 'input.js');
    const jsCode = await readFile(jsCodePath, 'utf-8');
    const opts = await getOpts(fixtureDir);
    await Promise.all(
      opts.map(async opt => {
        const outputPath = path.join(fixtureDir, `output.${opt.templateEngine}`);
        const output = await readFile(outputPath, 'utf-8');
        const result = await compile(jsCode, opt);
        expect(result).toBe(output);
      })
    );
  }
});

fixturesTester({
  testSuiteTitle: 'while using unreact.compileFile()',
  fixturesDir: path.join(__dirname, 'fixtures', 'compile-file'),
  generateTest: async ({ fixtureDir }) => {
    const jsCodePath = path.join(fixtureDir, 'input.js');
    const opts = await getOpts(fixtureDir);
    await Promise.all(
      opts.map(async opt => {
        const outputPath = path.join(fixtureDir, `output.${opt.templateEngine}`);
        await compileFile(jsCodePath, outputPath, opt);
        const output = await readFile(outputPath, 'utf-8');
        expect(output).toMatchSnapshot(undefined, opt.templateEngine);
      })
    );
  }
});

fixturesTester({
  testSuiteTitle: 'while using unreact.compileDir()',
  fixturesDir: path.join(__dirname, 'fixtures', 'compile-dir'),
  generateTest: async ({ fixtureDir }) => {
    const opts = await getOpts(fixtureDir);
    await Promise.all(
      opts.map(async opt => {
        await compileDir(fixtureDir, fixtureDir, opt);
        const NestedPath = path.join(fixtureDir, `Nested.${opt.templateEngine}`);
        const SimplePath = path.join(fixtureDir, `Simple.${opt.templateEngine}`);
        const Nested = await readFile(NestedPath, 'utf-8');
        const Simple = await readFile(SimplePath, 'utf-8');
        expect(`${Nested}\n${Simple}`).toMatchSnapshot(undefined, opt.templateEngine);
      })
    );
  }
});

function fixturesTester({ testSuiteTitle, fixturesDir, generateTest, only = '', skip = '' } = {}) {
  if (!testSuiteTitle) {
    throw new TypeError('`opts.testSuiteTitle` is required');
  }
  if (!fixturesDir) {
    throw new TypeError('`opts.fixturesDir` is required');
  }
  if (!generateTest) {
    throw new TypeError('`opts.generateTest` is required');
  }
  describe(testSuiteTitle, () => {
    fs.readdirSync(fixturesDir).forEach(caseName => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const blockTitle = caseName.split('-').join(' ');
      const itOnly = only === caseName || only.includes(caseName);
      const itSkip = skip === caseName || skip.includes(caseName);
      const itCustom = getIt(itOnly, itSkip);
      itCustom(blockTitle, async () => {
        await generateTest({ fixtureDir });
      });
    });
  });
}

function getIt(itOnly, itSkip) {
  if (itOnly) {
    return it.only;
  }
  if (itSkip) {
    return it.skip;
  }
  return it;
}

async function getOpts(fixtureDir) {
  const optsJSONPath = path.join(fixtureDir, 'opts.json');
  const optsJSPath = path.join(fixtureDir, 'opts.js');
  const optsJSONExists = fs.existsSync(optsJSONPath);
  const optsJSExists = fs.existsSync(optsJSPath);
  if (optsJSONExists) {
    const optsRaw = await readFile(optsJSONPath, 'utf-8');
    const opts = JSON.parse(optsRaw);
    return opts;
  }
  if (optsJSExists) {
    const opts = require(optsJSPath); // eslint-disable-line global-require, import/no-dynamic-require
    return opts;
  }
  throw new TypeError(`Couldn't find an options file for ${fixtureDir}`);
}
