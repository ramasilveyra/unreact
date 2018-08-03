import React from 'react';

const Input = ({ error, errorMsg, onlyLogo, text, company, app }) => (
  <div>
    {error && errorMsg ? <p className="hlp-input-message hlp-input-errormsg">{errorMsg}</p> : null}
    {onlyLogo
      ? null
      : text || (
          <p>
            Log In to <strong>{company}</strong> to get started using <strong>{app}</strong>.
          </p>
        )}
  </div>
);

const Main = () => <Input text="lorem ipsum" />;

export default Main;
