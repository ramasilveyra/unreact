import React from 'react';

const Input = ({ error, valid, warning }) => (
  <input
    className={`input ${error ? 'ulp-input-error' : ''} ${valid ? 'ulp-input-valid' : ''} ${
      warning ? 'ulp-input-warning' : ''
    }`}
  />
);
const Main = ({ valid }) => <Input valid={valid} warning />;

export default Main;
