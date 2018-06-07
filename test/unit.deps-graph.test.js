import DepGraph from '../src/deps-graph';

describe('while using DepGraph()', () => {
  it("should not allow add a dependency with a module that doesn't exist", () => {
    const deps = new DepGraph();
    deps.addModule('./src/index.js', {}, {});
    deps.addModule('./src/cli.js', {}, {});
    expect(() => deps.addDependency('./src/utils.js', './src/index.js')).toThrow();
    expect(() => deps.addDependency('./src/index.js', './src/utils.js')).toThrow();
  });
});
