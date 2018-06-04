export default class DependencyGraph {
  constructor() {
    this.modules = [];
  }

  addModule(path, ast, table) {
    return this.modules.push({
      path,
      ast,
      table,
      dependencies: []
    });
  }

  find(path) {
    return this.modules.find(node => node.path === path);
  }

  addDependency(startPath, endPath) {
    const startNode = this.find(startPath);
    const endNode = this.find(endPath);

    if (!startNode || !endNode) {
      throw new Error('Both modules need to exist');
    }

    startNode.dependencies.push(endNode);
  }
}
