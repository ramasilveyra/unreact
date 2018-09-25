import React from 'react';

const Foo = ({ description }) => (
  <div>
    {onlyLogo ? null : description || <p>Lorem Ipsum.</p>}
    {description && <div>{description}</div>}
    <a href="#">See more</a>
  </div>
);
const Foo2 = ({ something }) => (
  <Foo
    description={
      <p>
        Lorem impsum: <strong>{something}</strong>
      </p>
    }
  />
);
const Main = ({ something }) => <Foo2 something={something} />;

export default Main;
