import fs from 'fs';
import path from 'path';
import util from 'util';
import resolveFrom from 'resolve-from';
import makeDir from 'make-dir';
import globby from 'globby';
import parser from './parser';
import transformation from './transformation';
import DependencyGraph from './deps-graph';
import { codeGenerator, optimize } from './ejs';

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

export async function compile(inputCode, inputFile) {
  const { ast, table } = parseTransformOptimize(inputCode);
  if (inputFile) {
    const { bundleAST, bundleTable } = await resolveDependencies(inputFile, ast, table);
    const optimizedAST = optimize(bundleAST, bundleTable);
    const code = codeGenerator(optimizedAST);
    return code;
  }
  const optimizedAST = optimize(ast, table);
  const code = codeGenerator(optimizedAST);
  return code;
}

function parseTransformOptimize(inputCode) {
  const oldAst = parser(inputCode);
  const { ast, table } = transformation(oldAst);
  const optimizedAST = optimize(ast, table);
  return { ast: optimizedAST, table };
}

async function resolveDependencies(moduleFile, moduleAST, moduleTable) {
  const depGraph = new DependencyGraph();
  depGraph.addModule(moduleFile, moduleAST, moduleTable);
  await parseModule(moduleFile, moduleTable, depGraph);
  const preBundleTable = depGraph.modules.map(dep => dep.table);
  const bundleTable = preBundleTable.reduce(
    (acc, item) => ({
      components: Object.assign({}, acc.components, item.components),
      dependencies: Object.assign({}, acc.dependencies, item.dependencies)
    }),
    {}
  );
  return { bundleAST: moduleAST, bundleTable };
}

async function parseModule(moduleFile, moduleTable, depGraph) {
  await Promise.all(
    Object.values(moduleTable.dependencies).map(async dep => {
      if (dep.isUsedAsRC) {
        const depDirPath = path.dirname(moduleFile);
        const depFilePath = await resolveFrom(depDirPath, dep.source);
        const depCode = await readFileAsync(depFilePath, { encoding: 'utf8' });
        const { ast: depAST, table: depTable } = parseTransformOptimize(depCode);
        depGraph.addModule(depFilePath, depAST, depTable);
        depGraph.addDependency(moduleFile, depFilePath);
        await parseModule(depFilePath, depTable, depGraph);
      }
    })
  );
}

export async function compileFile(inputFile, outputFile, progress = () => {}) {
  const inputFilePath = path.resolve(process.cwd(), inputFile);
  const outputFilePath = path.resolve(process.cwd(), outputFile);
  const inputCode = await readFileAsync(inputFilePath, { encoding: 'utf8' });
  const code = await compile(inputCode, inputFilePath);
  const outputFilePathDir = path.dirname(outputFilePath);
  await makeDir(outputFilePathDir);
  await writeFileAsync(outputFilePath, code);
  const relativePath = path.join(process.cwd(), '/');
  progress(`${inputFile.replace(relativePath, '')} -> ${outputFile.replace(relativePath, '')}`);
}

export async function compileDir(inputDir, outputDir, progress = () => {}) {
  const inputDirPath = path.resolve(process.cwd(), inputDir);
  const outputDirPath = path.resolve(process.cwd(), outputDir);
  const globInputDirPath = path.join(inputDirPath, '/**/*.{js,jsx,mjs}');
  const filePaths = await globby(globInputDirPath);
  await Promise.all(
    filePaths.map(filePath => {
      const oldExtension = path.extname(filePath);
      const outputFile = filePath
        .replace(inputDirPath, outputDirPath)
        .replace(oldExtension, '.ejs');
      return compileFile(filePath, outputFile, progress);
    })
  );
}
