import React from 'react';

const Item = ({ name }) => <li>{name}</li>;
const List = () => <ul>{list.map(name => <Item name={name} />)}</ul>;

export default Foo;
