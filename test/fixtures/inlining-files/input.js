import React from 'react';
import Container from './Container';
import Notice from './Notice';
import Item from './Item';

const List = ({ list }) => (
  <Container>
    <Notice />
    <ul>{list.map(item => <Item>{item}</Item>)}</ul>
  </Container>
);

export default List;
