/* eslint-disable no-console */
import yargs from 'yargs';
import chalk from 'chalk';
import ora from 'ora';
import { compileFile, compileDir } from './index';
import pkg from '../package.json';

export default function unreactCLI(argv) {
  console.log(chalk.bold.white(`${pkg.name} v${pkg.version}`));

  const parsedArgv = yargs(argv)
    .option('o', {
      alias: 'out-file',
      describe: 'Output file',
      type: 'string'
    })
    .option('O', {
      alias: 'out-dir',
      describe: 'Output dir',
      type: 'string'
    })
    .usage(`${pkg.description}.\nUsage: $0 <file or dir> [options]`)
    .version()
    .alias('version', 'v')
    .help()
    .alias('help', 'h').argv;
  const fileOrDir = parsedArgv._[0];
  const spinner = ora({ text: 'Processing...' });
  const progress = report => {
    spinner.stopAndPersist({ text: `${chalk.gray(report)}` });
  };

  if (fileOrDir && parsedArgv.o) {
    spinner.start();
    return compileFile(fileOrDir, parsedArgv.o, progress)
      .then(() => {
        spinner.succeed(`${chalk.bold.green('success')} file transformed to EJS`);
      })
      .catch(err => {
        spinner.stopAndPersist();
        spinner.fail(`${chalk.bold.red('error')} ${err.message}`);
        process.exit(1);
      });
  }

  if (fileOrDir && parsedArgv.O) {
    spinner.start();
    return compileDir(fileOrDir, parsedArgv.O, progress)
      .then(() => {
        spinner.succeed(`${chalk.bold.green('success')} folder transformed to EJS`);
      })
      .catch(err => {
        spinner.stopAndPersist();
        spinner.fail(`${chalk.bold.red('error')} ${err.message}`);
        process.exit(1);
      });
  }

  return null;
}
