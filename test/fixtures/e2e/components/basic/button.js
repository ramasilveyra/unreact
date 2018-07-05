import React from 'react';

const Button = ({ type, name, appearance, onClick, children, innerRef, disabled, noMarginTop }) =>
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
        Log in with {name.charAt(0).toUpperCase()}
        {name.slice(1).toLowerCase()}
      </span>
    </button>
  ) : (
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

export default Button;
