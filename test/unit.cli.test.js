import pkg from '../package.json';

let unreactCli = null;
let compileFile = null;
let compileDir = null;

describe('while using unreact cli', () => {
  beforeAll(() => {
    jest.mock('../src/index', () => ({
      compileFile: jest.fn((i, o, opts) => {
        opts.progress();
        return Promise.resolve();
      }),
      compileDir: jest.fn((i, o, opts) => {
        opts.progress();
        return Promise.resolve();
      })
    }));
    jest.mock('ora', () =>
      jest.fn().mockImplementation(() => ({
        stopAndPersist: jest.fn(),
        start: jest.fn(),
        succeed: jest.fn(),
        fail: jest.fn()
      }))
    );
    const unreact = require('../src/index'); // eslint-disable-line global-require
    unreactCli = require('../src/cli').default; // eslint-disable-line global-require
    compileFile = unreact.compileFile;
    compileDir = unreact.compileDir;
  });

  beforeEach(() => {
    /* eslint-disable no-console */
    process.exit = jest.fn().mockReset();
    console.log = jest.fn().mockReset();
    compileFile.mockClear();
    compileDir.mockClear();
  });

  it('should log initial message when no argument is passed', () => {
    unreactCli([]);
    expect(process.exit.mock.calls.length).toEqual(0);
    expect(console.log.mock.calls.length).toEqual(1);
    expect(console.log.mock.calls[0][0]).toBe(
      `\u001b[1m\u001b[37m${pkg.name} v${pkg.version}\u001b[39m\u001b[22m`
    );
  });

  it('should log version and initial message with "-v" or "--version"', () => {
    unreactCli(['-v']);
    unreactCli(['--version']);
    expect(process.exit.mock.calls.length).toEqual(2);
    expect(console.log.mock.calls.length).toEqual(4);
    expect(console.log.mock.calls[0][0]).toBe(
      `\u001b[1m\u001b[37m${pkg.name} v${pkg.version}\u001b[39m\u001b[22m`
    );
    expect(console.log.mock.calls[1][0]).toBe(pkg.version);
  });

  it('should compile file with "some-component.js -o some-component.ejs"', async () => {
    const input = 'some-component.js';
    const output = 'some-component.ejs';
    const result = unreactCli([input, '-o', output]);
    expect(process.exit.mock.calls.length).toEqual(0);
    expect(console.log.mock.calls.length).toEqual(1);
    expect(console.log.mock.calls[0][0]).toBe(
      `\u001b[1m\u001b[37m${pkg.name} v${pkg.version}\u001b[39m\u001b[22m`
    );
    expect(compileFile.mock.calls.length).toEqual(1);
    expect(compileFile.mock.calls[0][0]).toBe(input);
    expect(compileFile.mock.calls[0][1]).toBe(output);
    expect(typeof compileFile.mock.calls[0][2]).toBe('object');
    expect(typeof compileFile.mock.calls[0][2].progress).toBe('function');
    expect(compileFile.mock.calls[0][2].templateEngine).toBe('pug');
    await expect(result).resolves.toBeUndefined();
  });

  it('should log error and exit if compile file with "some-component.js -o some-component.ejs" fails', async () => {
    const errorMsg = 'No such file';
    compileFile.mockImplementation((i, o, opts) => {
      opts.progress();
      return Promise.reject(new Error(errorMsg));
    });
    const input = 'some-component.js';
    const output = 'some-component.ejs';
    const result = unreactCli([input, '-o', output]);
    expect(console.log.mock.calls.length).toEqual(1);
    expect(console.log.mock.calls[0][0]).toBe(
      `\u001b[1m\u001b[37m${pkg.name} v${pkg.version}\u001b[39m\u001b[22m`
    );
    expect(compileFile.mock.calls.length).toEqual(1);
    expect(compileFile.mock.calls[0][0]).toBe(input);
    expect(compileFile.mock.calls[0][1]).toBe(output);
    expect(typeof compileFile.mock.calls[0][2]).toBe('object');
    expect(typeof compileFile.mock.calls[0][2].progress).toBe('function');
    expect(compileFile.mock.calls[0][2].templateEngine).toBe('pug');
    await expect(result).resolves.toBeUndefined();
    expect(process.exit.mock.calls.length).toEqual(1);
    expect(process.exit.mock.calls[0][0]).toEqual(1);
  });

  it('should compile dir with "components -O build"', async () => {
    const input = 'components';
    const output = 'build';
    const result = unreactCli([input, '-O', output]);
    expect(process.exit.mock.calls.length).toEqual(0);
    expect(console.log.mock.calls.length).toEqual(1);
    expect(console.log.mock.calls[0][0]).toBe(
      `\u001b[1m\u001b[37m${pkg.name} v${pkg.version}\u001b[39m\u001b[22m`
    );
    expect(compileDir.mock.calls.length).toEqual(1);
    expect(compileDir.mock.calls[0][0]).toBe(input);
    expect(compileDir.mock.calls[0][1]).toBe(output);
    expect(typeof compileDir.mock.calls[0][2]).toBe('object');
    expect(typeof compileDir.mock.calls[0][2].progress).toBe('function');
    expect(compileDir.mock.calls[0][2].templateEngine).toBe('pug');
    await expect(result).resolves.toBeUndefined();
  });

  it('should log error and exit if compile dir with "components -O build" fails', async () => {
    const errorMsg = 'No such file';
    compileDir.mockImplementation((i, o, opts) => {
      opts.progress();
      return Promise.reject(new Error(errorMsg));
    });
    const input = 'components';
    const output = 'build';
    const result = unreactCli([input, '-O', output]);
    expect(console.log.mock.calls.length).toEqual(1);
    expect(console.log.mock.calls[0][0]).toBe(
      `\u001b[1m\u001b[37m${pkg.name} v${pkg.version}\u001b[39m\u001b[22m`
    );
    expect(compileDir.mock.calls.length).toEqual(1);
    expect(compileDir.mock.calls[0][0]).toBe(input);
    expect(compileDir.mock.calls[0][1]).toBe(output);
    expect(typeof compileDir.mock.calls[0][2]).toBe('object');
    expect(typeof compileDir.mock.calls[0][2].progress).toBe('function');
    expect(compileDir.mock.calls[0][2].templateEngine).toBe('pug');
    await expect(result).resolves.toBeUndefined();
    expect(process.exit.mock.calls.length).toEqual(1);
    expect(process.exit.mock.calls[0][0]).toEqual(1);
  });
});
