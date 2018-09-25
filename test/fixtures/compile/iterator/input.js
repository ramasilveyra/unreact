import React from 'react';

const Foo = ({ list }) => (
  <div>
    <ul>{list.map(item => <li>{item}</li>)}</ul>
    <ul>
      {list.map((item, index) => (
        <li>
          {item} at {index}
        </li>
      ))}
    </ul>
    <ul>
      {list.map((item, index, array) => (
        <li>
          {item} at {index} of {array.join(', ')}
        </li>
      ))}
    </ul>
  </div>
);

export default Foo;
