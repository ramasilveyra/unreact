import React from 'react';

const Notice = ({ name, description }) => (
  <p>
    This {name} list {description}
  </p>
);
const Button = ({ appearence }) => (
  <button className={`btn btn-${appearence || 'default'}`}>Submit</button>
);
const Container = ({ className, children }) => <div className={className}>{children}</div>;
const Item = ({ name, children }) => <li>{children}</li>;
const List = ({ list, name }) => (
  <Container className="container">
    <Notice name={name} description="is awesome" />
    <ul>{list.map(item => <Item>{item}</Item>)}</ul>
    <Button appearence="light" />
  </Container>
);

export default List;
