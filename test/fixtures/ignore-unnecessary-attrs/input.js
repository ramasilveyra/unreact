import React from 'react';

const Foo = ({ onClick, innerRef }) => (
  <div>
    <div key="1" />
    <div onClick={onClick} />
    <div ref={innerRef} />
  </div>
);

export default Foo;
