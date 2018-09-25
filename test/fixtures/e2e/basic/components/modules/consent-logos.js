import React from 'react';

const ConsentLogos = ({ userImg, appLogo }) => (
  <div className="consent-logos">
    <img src={userImg} alt="" />
    <span className="exchange-arrows" />
    <img src={appLogo} alt="" />
  </div>
);

export default ConsentLogos;
