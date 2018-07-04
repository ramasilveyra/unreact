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
    .option('t', {
      alias: 'template-engine',
      describe: 'Output template engine',
      type: 'string',
      default: 'pug',
      choices: ['pug', 'ejs']
    })
    .option('add-beginning', {
      describe: 'Add string to the beginning of the output file',
      type: 'string'
    })
    .option('add-ending', {
      describe: 'Add string to the ending of the output file',
      type: 'string'
    })
    .option('initial-indent-level', {
      describe: 'Start at <number> indent level',
      type: 'number',
      default: 0
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
  const templateEngine = parsedArgv.t;
  const beginning = parsedArgv['add-beginning'];
  const ending = parsedArgv['add-ending'];
  const initialIndentLevel = parsedArgv['initial-indent-level'];

  if (fileOrDir && parsedArgv.o) {
    spinner.start();
    return compileFile(fileOrDir, parsedArgv.o, {
      templateEngine,
      beginning,
      ending,
      initialIndentLevel,
      progress
    })
      .then(() => {
        spinner.succeed(`${chalk.bold.green('success')} file transformed to ${templateEngine}`);
      })
      .catch(err => {
        spinner.stopAndPersist();
        spinner.fail(`${chalk.bold.red('error')} ${err.stack}`);
        process.exit(1);
      });
  }

  if (fileOrDir && parsedArgv.O) {
    spinner.start();
    return compileDir(fileOrDir, parsedArgv.O, {
      templateEngine,
      beginning,
      ending,
      initialIndentLevel,
      progress
    })
      .then(() => {
        spinner.succeed(`${chalk.bold.green('success')} folder transformed to ${templateEngine}`);
      })
      .catch(err => {
        spinner.stopAndPersist();
        spinner.fail(`${chalk.bold.red('error')} ${err.message}`);
        process.exit(1);
      });
  }

  return null;
}
