import React from 'react';

const Input = ({ name, inputType, error, errorMsg, valid, validMsg }) =>
  error && errorMsg ? <p className="hlp-input-message hlp-input-errormsg">{errorMsg}</p> : null;

export default Input;
