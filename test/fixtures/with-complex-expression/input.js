import React from 'react';

const SayHello = ({ name, debt, revenue, getSomehing }) => (
  <div>
    <p>Hello, {name}!</p>
    Your balance is: {revenue - debt}
    Something: {getSomehing()}
    {`Bye ${name}`}
  </div>
);

export default SayHello;
