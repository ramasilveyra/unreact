import React from 'react';

const Notice = () => <p>This list:</p>;
const Hi = ({ word }) => <p>{word}</p>;
const Bye = ({ className }) => <p className={className}>bye</p>;
const Container = ({ children }) => <div>{children}</div>;
const Item = ({ children }) => <li>{children}</li>;
const List = ({ list }) => <ul>{list.map(item => <Item>{item}</Item>)}</ul>;
const Foo = ({ showIcon }) => (
  <div>
    {showIcon ? <span className="icon icon-123">Menu</span> : 'Hi!'}
    <strong>something</strong>
  </div>
);
const Foo2 = ({ showIcon, reallyShowIcon }) => (
  <div>{showIcon && reallyShowIcon ? <span className="icon icon-123">Menu</span> : 'Hi!'}</div>
);
const Button = ({ appearance, noMarginTop, onClick, innerRef, children }) => (
  <button
    disabled={disabled}
    className={`hlp-button hlp-button-${appearance || 'default'} ${
      noMarginTop ? 'no-margin-top' : ''
    }`}
    onClick={onClick}
    ref={innerRef}
  >
    {children}
  </button>
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
    <Hi />
    <Bye />
    <Button>Hola</Button>
  </Container>
);

export default Main;
