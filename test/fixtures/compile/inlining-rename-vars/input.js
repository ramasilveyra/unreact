import React from 'react';

const Input = ({ error, errorMsg }) => <div>{error && errorMsg && <p>{errorMsg}</p>}</div>;

const Foo = ({ passwordError }) => <Input errorMsg={passwordError} error={!!passwordError} />;

export default Foo;
