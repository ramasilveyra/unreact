import React from 'react';

const ConsentList = ({ items }) => (
  <ul className="consent-list">
    {items.map(item => (
      <li key={item.name}>
        <b>{item.name}:</b> {item.description}
      </li>
    ))}
  </ul>
);

export default ConsentList;
