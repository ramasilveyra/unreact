import React from 'react';

const Notice = () => <p>This list:</p>;
const Container = ({ children }) => <div>{children}</div>;
const Item = ({ children }) => <li>{children}</li>;
const List = ({ list }) => (
  <Container>
    <Notice />
    <ul>{list.map(item => <Item>{item}</Item>)}</ul>
    <Container>Hola!</Container>
    <Container>Chau!</Container>
  </Container>
);

export default List;
