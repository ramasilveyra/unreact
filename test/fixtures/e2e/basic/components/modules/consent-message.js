import React from 'react';

const ConsentMessage = ({ userName, appName }) => (
  <div className="consent-welcome-text">
    <p>Hey {userName}!</p>
    <p>{appName} is requesting access to your account</p>
  </div>
);

export default ConsentMessage;
