import React from 'react';
import Button from './components/basic/button';
import Header from './components/modules/header';
import Container from './components/modules/container';
import ConsentExchangeLogos from './components/modules/consent-logos';
import ConsentMessage from './components/modules/consent-message';
import ConsentList from './components/modules/consent-list';

const ConsentPreview = () => (
  <section className="hlp-box">
    <Header
      image="../../static/img/logo-generic.svg"
      title="Welcome"
      company="Company"
      app="MyApp"
      onlyLogo
    />

    <ConsentExchangeLogos
      userImg="../../static/img/avatar.svg"
      appLogo="../../static/img/app-logo.svg"
    />

    <Container>
      <ConsentMessage userName="user@email.com" appName="Ramen App" />

      <ConsentList
        items={[
          {
            name: 'Profile',
            description: 'Username, profile pic and gender'
          },
          {
            name: 'Another Scope',
            description: 'Another scope description'
          }
        ]}
      />

      <div className="consent-button-bar">
        <Button appearance="simple">Decline</Button>
        <Button>Accept</Button>
      </div>
    </Container>
  </section>
);

const Consent = () => (
  <main className="hlp-outer">
    <ConsentPreview />
  </main>
);

export default ConsentPreview;
