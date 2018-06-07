import React from 'react';

const Notice = () => <p>This list:</p>;
const Container = ({ children }) => <div>{children}</div>;
const Item = ({ children }) => <li>{children}</li>;
const List = ({ list }) => <ul>{list.map(item => <Item>{item}</Item>)}</ul>;
const Foo = ({ showIcon }) => (
  <div>{showIcon ? <span className="icon icon-123">Menu</span> : 'Hi!'}</div>
);
const Foo2 = ({ showIcon, reallyShowIcon }) => (
  <div>{showIcon && reallyShowIcon ? <span className="icon icon-123">Menu</span> : 'Hi!'}</div>
);
const Main = ({ list }) => (
  <Container>
    <Notice />
    <List list={['John', 'Doe']} />
    <Container>Hola!</Container>
    <Container>Chau!</Container>
    <Foo showIcon />
    <Foo showIcon={true} />
    <Foo showIcon="asdasd" />
    <Foo2 showIcon reallyShowIcon />
  </Container>
);

export default Main;
