import React from 'react';

const Foo = ({ showIcon }) => <div className={showIcon ? 'icon-123' : 'icon-456'} />;

export default Foo;
