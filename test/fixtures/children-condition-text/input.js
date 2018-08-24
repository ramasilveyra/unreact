import React from 'react';
// prettier-ignore
const Foo = () => (
  <div>
    {items.map(item => (
      <li key={item.key}>
        {item.name && <b>{item.name}: </b>}{item.description}
      </li>
    ))}
  </div>
);

export default Foo;
