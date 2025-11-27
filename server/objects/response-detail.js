;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const moment = require('moment');
  const urljoin = require('url-join');
  
  const processingStatusMapping = {
    TODO: 'To do',
    AWAITING_CONTACT: 'Awaiting juror',
    AWAITING_COURT_REPLY: 'Awaiting court reply',
    AWAITING_TRANSLATION: 'Awaiting translation',
    CLOSED: 'Completed',
  };

  const statusMapping = {
    1: 'Summoned',
    2: 'Responded',
    3: 'Panel',
    4: 'Juror',
    5: 'Excused',
    6: 'Disqualified',
    7: 'Deferred',
    8: 'Reassign',
    9: 'Undeliverable',
    10: 'Transferred',
    11: 'Awaiting Info',
  };

  const transformStrCheck = function(val) {
    if (typeof val === 'undefined' || val === null) {
      return '';
    }

    if (val.replace(/ /g, '').length === 0) {
      return '';
    }

    return val;
  };

  const getSingleTransform = function(body, hasModAccess) {
    const { dateFilter } = require('../components/filters');
    var newObj = body;

    newObj.currentOwner = body.current_owner;
    newObj.read = (newObj.processingStatus !== 'unread');
    newObj.dateReceived = moment(newObj.dateReceived).format('DD/MM/YYYY');
    newObj.hearingDate = newObj.hearingDate !== null
      ? dateFilter(new Date(newObj.hearingDate), null, 'DD/MM/YYYY') : null;
    newObj.dateOfBirth = newObj.dateOfBirth ? moment(newObj.dateOfBirth).format('DD/MM/YYYY') : null;
    newObj.newDateOfBirth = moment(newObj.newDateOfBirth).format('DD/MM/YYYY');
    newObj.statusRender = statusMapping[newObj.status];
    if (
      statusMapping[newObj.status] === 'Responded'
      && (
        newObj.thirdPartyReason
        && newObj.thirdPartyReason.toLowerCase() === 'deceased'
        && hasModAccess
      )
    ) {
      newObj.statusRender = newObj.thirdPartyReason;
    }
    newObj.rawProcessingStatus = newObj.processingStatus;
    newObj.processingStatusRender = processingStatusMapping[newObj.processingStatus];


    // Filter out empty spaces, nulls, etc and transform them into empty strings for comparison of old and new
    newObj.jurorAddress1 = transformStrCheck(newObj.jurorAddress1);
    newObj.jurorAddress2 = transformStrCheck(newObj.jurorAddress2);
    newObj.jurorAddress3 = transformStrCheck(newObj.jurorAddress3);
    newObj.jurorAddress4 = transformStrCheck(newObj.jurorAddress4);
    newObj.jurorAddress5 = transformStrCheck(newObj.jurorAddress5);
    newObj.jurorAddress6 = transformStrCheck(newObj.jurorAddress6);
    newObj.jurorPostcode = transformStrCheck(newObj.jurorPostcode);

    newObj.newJurorAddress1 = transformStrCheck(newObj.newJurorAddress1);
    newObj.newJurorAddress2 = transformStrCheck(newObj.newJurorAddress2);
    newObj.newJurorAddress3 = transformStrCheck(newObj.newJurorAddress3);
    newObj.newJurorAddress4 = transformStrCheck(newObj.newJurorAddress4);
    newObj.newJurorAddress5 = transformStrCheck(newObj.newJurorAddress5);
    newObj.newJurorAddress6 = transformStrCheck(newObj.newJurorAddress6);
    newObj.newJurorPostcode = transformStrCheck(newObj.newJurorPostcode);

    newObj.phoneNumber = transformStrCheck(newObj.phoneNumber);
    newObj.newPhoneNumber = transformStrCheck(newObj.newPhoneNumber);
    newObj.altPhoneNumber = transformStrCheck(newObj.altPhoneNumber);
    newObj.newAltPhoneNumber = transformStrCheck(newObj.newAltPhoneNumber);

    // Logs date formatting
    if (typeof newObj.phoneLogs !== 'undefined') {
      newObj.phoneLogs.sort(function(a, b) {
        return b.lastUpdate - a.lastUpdate;
      });

      newObj.phoneLogs.forEach(function(log) {
        log.dateRender = moment(log.lastUpdate).format('DD/MM/YYYY');
        log.timeRender = moment(log.lastUpdate).format('HH:mm');
      });
    }

    if (typeof newObj.changeLog !== 'undefined') {
      newObj.changeLog.forEach(function(log) {
        log.dateRender = moment(log.timestamp).format('DD/MM/YYYY');
        log.timeRender = moment(log.timestamp).format('HH:mm');

        log.items.forEach(function(logItem) {
          if (logItem.newKeyName === 'dateOfBirth') {
            logItem.oldValue = moment(logItem.oldValue, 'YYYY-MM-DD HH:mm:ss\.S').format('DD/MM/YYYY');
            logItem.newValue = moment(logItem.newValue, 'YYYY-MM-DD HH:mm:ss\.S').format('DD/MM/YYYY');
          }
        });
      });

      newObj.changeLog.sort(function(a, b) {
        return a.timestamp < b.timestamp;
      });
    }

    if (typeof newObj.specialNeeds !== 'undefined') {
      newObj.specialNeeds.forEach(function(need) {
        need.detail = need.detail.replace('\\n', '<br>')
          .replace('\n', '<br>')
          .replace(/(?:\r\n|\r|\n)/g, '<br>');
      });
    }

    if (newObj.specialNeedsArrangements) {
      newObj.specialNeedsArrangements = newObj.specialNeedsArrangements.replace('\\n', '<br>')
        .replace('\n', '<br>')
        .replace(/(?:\r\n|\r|\n)/g, '<br>');
    }

    return newObj;
  };

  module.exports.object = {
    get: function(req, id) {
      const dao = new DAO(urljoin('moj/juror-record/digital-detail', id), {
        get: function() {
          return {
            uri: this.resource,
            transform: getSingleTransform,
          }
        }
      });

      return dao.get(req);
    },
  };

})();
