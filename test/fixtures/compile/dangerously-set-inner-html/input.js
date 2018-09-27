import React from 'react';

const Foo = ({ message }) => <div dangerouslySetInnerHTML={{ __html: message }} />;

export default Foo;
