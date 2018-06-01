import React from 'react';

const Foo = ({ showIcon }) => (
  <div>{showIcon ? <span className="icon icon-123">Menu</span> : 'Hi!'}</div>
);

export default Foo;
