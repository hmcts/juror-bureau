;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  const statusMapping = {
    TODO: 'To do',
    AWAITING_CONTACT: 'Awaiting juror',
    AWAITING_COURT_REPLY: 'Awaiting court reply',
    AWAITING_TRANSLATION: 'Awaiting translation',
    CLOSED: 'Completed',
  };

  const fetchValue = function(response, key) {
    if (Object.prototype.hasOwnProperty.call(response, key)) {
      return response[key];
    }

    return '';
  };

  const searchTransform = function(body) {
    var searchData = {
      data: [],
      meta: Object.prototype.hasOwnProperty.call(body, 'meta') ? body.meta : {},
    };

    // Verify we have a data field
    if (Object.prototype.hasOwnProperty.call(body, 'data') === false) {
      return false;
    }

    body.data.forEach(function(response) {
      searchData.data.push({
        rawDateReceived: fetchValue(response, 'dateReceived'),
        dateReceived: moment(fetchValue(response, 'dateReceived')).format('DD/MM/YYYY'),
        jurorNumber: fetchValue(response, 'jurorNumber'),
        name: [
          fetchValue(response, 'title'),
          fetchValue(response, 'firstName'),
          fetchValue(response, 'lastName'),
        ].filter(function(val) {
          return typeof val !== 'undefined' && val !== null && val.length > 0;
        }).join(' '),
        postcode: fetchValue(response, 'postcode'),
        poolNumber: fetchValue(response, 'poolNumber'),
        urgent: fetchValue(response, 'urgent'),
        superUrgent: fetchValue(response, 'superUrgent'),
        slaOverdue: fetchValue(response, 'slaOverdue'),
        isUrgent: (fetchValue(response, 'urgent') || fetchValue(response, 'superUrgent')),
        isClosed: (fetchValue(response, 'processingStatus') === 'CLOSED'),
        staff: fetchValue(response, 'assignedStaffMember'),
        status: statusMapping[fetchValue(response, 'processingStatus')],
      });
    });

    return searchData;
  };

  module.exports.searchDAO = new DAO('bureau/responses/search', {
    post: function(body) {
      return {body, transform: searchTransform};
    }}
  );
})();
