import React from 'react';

const Foo = ({ showIcon, showIconTwice }) => (
  <div>
    {showIcon && <span className="icon icon-123">Menu</span>}
    {showIcon && showIconTwice && <span className="icon icon-123">Menu</span>}
    {showIcon || <span className="icon icon-321">Close</span>}
  </div>
);

export default Foo;
