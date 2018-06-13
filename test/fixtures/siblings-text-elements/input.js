import React from 'react';

const Foo = ({ name }) => (
  <div>
    <div>
      <strong>Name</strong>: {name}
    </div>
    <div>
      <strong>Name</strong>
      {name}
    </div>
  </div>
);

export default Foo;
