import React from 'react';
import PropTypes from 'prop-types';

const Foo2 = ({ action, items }) => (
  <div>
    <input type="hidden" value={action} />
    {items.map(item => <div>{item}</div>)}
  </div>
);

Foo2.propTypes = {
  action: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.string)
};

Foo2.defaultProps = {
  action: 'default',
  items: []
};

const Foo = ({ action, items }) => <Foo2 action={action} items={items} />;

Foo.propTypes = {
  action: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default Foo;
