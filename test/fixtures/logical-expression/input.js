import React from 'react';

const Foo = ({ showIcon }) => (
  <div>
    {showIcon && <span className="icon icon-123">Menu</span>}
    {showIcon || <span className="icon icon-321">Close</span>}
  </div>
);

export default Foo;
