import React from 'react';
import PropTypes from 'prop-types';

const EventScreen = ({ eventClass, eventTitle, eventText, children }) => (
  <main className={`hlp-container hlp-event-screen`}>
    <div className="event-img-container">
      <span className={`event-img ${eventClass}`} />
    </div>
    <section className="event-container">
      {eventTitle && <h3 className="event-title">{eventTitle}</h3>}
      {eventText && <div className="event-text">{eventText}</div>}
      {children}
    </section>
  </main>
);

const StatusInner = ({ type, eventText, eventTitle, children }) => (
  <section className="hlp-box">
    <EventScreen eventClass={type} eventTitle={eventTitle} eventText={eventText}>
      {children}
    </EventScreen>
  </section>
);

export default StatusInner;
