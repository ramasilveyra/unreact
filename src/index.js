import fs from 'fs';
import path from 'path';
import util from 'util';
import makeDir from 'make-dir';
import globby from 'globby';
import parser from './parser';
import transformation from './transformation';
import { codeGenerator, optimize } from './ejs';

export function compile(inputCode) {
  const oldAst = parser(inputCode);
  const { ast: newAST, table } = transformation(oldAst);
  const optimizedAST = optimize(newAST, table);
  const code = codeGenerator(optimizedAST);
  return code;
}

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

export async function compileFile(inputFile, outputFile, progress = () => {}) {
  const inputFilePath = path.resolve(process.cwd(), inputFile);
  const outputFilePath = path.resolve(process.cwd(), outputFile);
  const inputCode = await readFileAsync(inputFilePath, { encoding: 'utf8' });
  const code = compile(inputCode);
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
