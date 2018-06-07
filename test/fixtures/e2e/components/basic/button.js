import React from 'react';

const Button = ({ type, name, copyTarget, appearance, onClick, children, innerRef }) =>
  type === 'social' ? (
    <button
      data-provider={name.toLowerCase()}
      tabIndex="0"
      type="button"
      className="idp-social-button"
      onClick={onClick}
    >
      <span className="idp-icon" data-provider={name.toLowerCase()} />
      <span className="idp-text">
        Login with {name.charAt(0).toUpperCase()}
        {name.slice(1).toLowerCase()}
      </span>
    </button>
  ) : (
    <button
      data-clipboard-target={copyTarget || null}
      className={`hlp-button hlp-button-${appearance || 'default'}`}
      onClick={onClick}
      ref={innerRef}
    >
      {children}
    </button>
  );

export default Button;
