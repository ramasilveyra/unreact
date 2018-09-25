import React from 'react';
import PropTypes from 'prop-types';

const Item = ({ item }) => <div>{item}</div>;

Item.propTypes = {
  items: PropTypes.string.isRequired
};

const Items = ({ items }) => (
  <>
    {items.map((item, i) => {
      if (i === 0 || true) {
        return (
          <div>
            <strong>{item}</strong>
          </div>
        );
      }
      return <Item item={item} />;
    })}
  </>
);

Items.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired
};

const Main = ({ items }) => {
  if (items.length > 1) {
    return <Items items={items} />;
  }

  return <Item item={items[0]} />;
};

Main.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default Main;
