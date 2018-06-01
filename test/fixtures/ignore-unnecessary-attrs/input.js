import React from 'react';

const Foo = ({ onClick }) => (
  <div>
    <div key="1" />
    <div onClick={onClick} />
  </div>
);

export default Foo;
