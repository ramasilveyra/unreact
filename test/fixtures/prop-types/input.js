import React from 'react';
import PropTypes from 'prop-types';

const Bar2 = ({ connection, something }) => (
  <div>
    <input type="hidden" name="something" value={something} />
    <input type="hidden" name="connection-raw" value={connection.name} />
    <input type="hidden" name="connection" value={connection.strategy.toLowerCase()} />
  </div>
);

Bar2.propTypes = {
  something: PropTypes.string,
  connection: PropTypes.shape({
    name: PropTypes.string.isRequired,
    strategy: PropTypes.string.isRequired
  }).isRequired
};

const Bar = ({ text }) => <h1>{text}</h1>;

Bar.propTypes = {
  text: PropTypes.string.isRequired
};

Bar.defaultProps = {
  text: 'Lorem Ipsum'
};
const Foo2 = ({ className }) => <div className={className} />;

Foo2.propTypes = {
  className: PropTypes.string.isRequired
};

const Foo = ({ className, connection, something }) => (
  <div className={className}>
    <Bar />
    <Foo2 className={className} />
    <Bar2 connection={connection} something={something} />
  </div>
);

Foo.propTypes = {
  className: PropTypes.string.isRequired,
  something: PropTypes.string,
  connection: PropTypes.shape({
    name: PropTypes.string.isRequired,
    strategy: PropTypes.string.isRequired
  }).isRequired
};

export default Foo;
