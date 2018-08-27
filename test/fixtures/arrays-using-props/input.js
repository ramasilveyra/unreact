import React from 'react';

const Item = ({ name, description }) => (
  <li>
    {name}: {description}
  </li>
);

const Main = ({ accountDescription, logoutDescription }) => (
  <ul>
    {[
      { name: 'Account', description: accountDescription },
      { name: 'Log out', description: logoutDescription }
    ].map((item, index) => <Item name={item.name} description={item.description || index} />)}
  </ul>
);

const Main2 = ({ accountDescription, logoutDescription }) => (
  <div>
    <Main accountDescription={accountDescription} logoutDescription={logoutDescription} />
  </div>
);

export default Main2;
