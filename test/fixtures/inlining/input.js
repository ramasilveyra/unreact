import React from 'react';

const Notice = () => <p>This list:</p>;
const Container = ({ children }) => <div>{children}</div>;
const Item = ({ children }) => <li>{children}</li>;
const List = ({ list }) => <ul>{list.map(item => <Item>{item}</Item>)}</ul>;
const Main = ({ list }) => (
  <Container>
    <Notice />
    <List list={['John', 'Doe']} />
    <Container>Hola!</Container>
    <Container>Chau!</Container>
  </Container>
);

export default Main;
