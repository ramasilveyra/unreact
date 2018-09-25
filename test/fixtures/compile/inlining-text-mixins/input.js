import React from 'react';

const Container = ({ children }) => <div>{children}</div>;
const Spinner = () => <div />;
const Main = ({ list }) => (
  <Container>
    <Spinner /> Awaiting confirmation...
  </Container>
);

export default Main;
