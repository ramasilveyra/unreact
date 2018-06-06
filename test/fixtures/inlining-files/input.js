import React from 'react';
import Container from './Container';
import Notice from './Notice';
import Item from './Item';
import Message from './Text';

const List = ({ list }) => (
  <Container>
    <Message />
    <Notice />
    <ul>{list.map(item => <Item>{item}</Item>)}</ul>
  </Container>
);

export default List;
