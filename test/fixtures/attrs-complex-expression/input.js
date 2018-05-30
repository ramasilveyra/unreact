import React from 'react';

const Foo = ({ className, otherClassName, getId, name }) => (
  <input
    id={getId()}
    className={className + otherClassName}
    tabIndex={80 / 2 + 3}
    placeholder={`Please type your ${name}`}
  />
);

export default Foo;
