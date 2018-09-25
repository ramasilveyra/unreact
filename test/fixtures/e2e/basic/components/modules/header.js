import React from 'react';

const Header = ({ image, title, company, app, text, onlyLogo }) => (
  <header className="hlp-header">
    <img src={image} alt={title} />
    <h1>{title}</h1>
    {onlyLogo
      ? null
      : text || (
          <p>
            Log In to <strong>{company}</strong> to get started using <strong>{app}</strong>.
          </p>
        )}
  </header>
);

export default Header;
