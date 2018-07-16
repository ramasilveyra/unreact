import React from 'react';

const Foo = ({ name }) => (
  <div>
    <ul>
      <li>Lower case: {name.toLowerCase()}</li>
      <li>Upper case: {name.toUpperCase()}</li>
      <li>Trim: {name.trim()}</li>
      <li>Trim + Upper: {name.trim().toUpperCase()}</li>
      <li>
        Trim + Upper + Lower: {name
          .trim()
          .toUpperCase()
          .toLowerCase()}
      </li>
      <li>Trim + Replace: {name.trim().replace('foo', 'bar')}</li>
      <li>Trim + CharAt: {name.trim().charAt(0)}</li>
      <li>Trim + Slice: {name.trim().slice(2, 5)}</li>
      <li>Poor man capitalize: {name.charAt(0).toUpperCase()}{name.slice(1).toLowerCase()}</li>
    </ul>
  </div>
);

export default Foo;
