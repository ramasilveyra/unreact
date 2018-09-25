import React from 'react';

const Foo2 = ({ showIcon }) => (
  <div>{showIcon ? <span className="icon icon-123">Menu</span> : 'Hi!'}</div>
);

const Foo = ({ showIcon }) => <div>{true ? <Foo2 showIcon={showIcon} /> : 'Hi!'}</div>;

export default Foo;
