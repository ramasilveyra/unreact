/* eslint-disable no-param-reassign */
function mergeVisitors(...visitors) {
  // e.g: visitors = [{ Program: { enter: function ProgramEnter1() {} } }, { Program: { enter: function ProgramEnter2() {} } }].
  const newVisitorData = visitors.reduce((v, visitor) => {
    Object.keys(visitor).forEach(nodeKey => {
      if (!v[nodeKey]) {
        v[nodeKey] = {
          enter: [],
          exit: []
        };
      }
      if (visitor[nodeKey].enter) {
        v[nodeKey].enter.push(visitor[nodeKey].enter);
      }
      if (visitor[nodeKey].exit) {
        v[nodeKey].exit.push(visitor[nodeKey].exit);
      }
    });
    return v;
  }, {});
  // e.g: newVisitorData = { Program: { enter: [function ProgramEnter1() {}, function ProgramEnter2() {}] } }.
  const newVisitor = Object.keys(newVisitorData).reduce((v, nodeKey) => {
    v[nodeKey] = {
      enter(node, parent) {
        newVisitorData[nodeKey].enter.forEach(visitorNode => {
          visitorNode(node, parent);
        });
      },
      exit(node, parent) {
        newVisitorData[nodeKey].exit.forEach(visitorNode => {
          visitorNode(node, parent);
        });
      }
    };
    return v;
  }, {});
  // e.g: newVisitor = { Program: { enter() => { ProgramEnter1(); ProgramEnter2(); }}.
  return newVisitor;
}

export default mergeVisitors;
