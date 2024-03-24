;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const moment = require('moment');

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
    var newObj = body;

    newObj.read = (newObj.processingStatus !== 'unread');
    newObj.dateReceived = moment(newObj.dateReceived).format('DD/MM/YYYY');
    newObj.hearingDate = newObj.hearingDate !== null ? moment(newObj.hearingDate).format('DD/MM/YYYY') : null;
    newObj.dateOfBirth = moment(newObj.dateOfBirth).format('DD/MM/YYYY');
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

  module.exports.digitalDetailDAO = new DAO('moj/juror-record/digital-detail', {
    get: function(id, hasModAccess = false) {
      const uri = urljoin(hasModAccess ? 'bureau/juror' : this.resource, id);

      return { uri, transform: (resp) => getSingleTransform(resp, hasModAccess) };
    }}
  );

  module.exports.digitalDetailNotesDAO = new DAO('bureau/juror', {
    get: function(id) {
      const uri = urljoin(this.resource, id, 'notes');

      return { uri };
    },
    put: function(id, notes, version) {
      const uri = urljoin(this.resource, id, 'notes');
      const body = { notes, version };

      return { uri, body };
    }}
  );

  module.exports.phoneLogDAO = new DAO('bureau/juror', {
    post: function(id, notes) {
      const uri = urljoin(this.resouce, id, 'phone');
      const body = { notes };

      return { uri, body };
    }}
  );

  module.exports.editJurorDetailsDAO = new DAO('bureau/juror', {
    post: function(jurorNumber, postBody) {
      const uri = urljoin(
        this.resource,
        jurorNumber,
        'details',
        (typeof postBody.thirdPartyFirstName === 'undefined') ? 'first-person' : 'third-party'
      );
      const body = {...postBody};

      delete body._csrf;
      delete body.emailAddressConfirmation;

      body.useJurorPhoneDetails = (body.useJurorPhoneDetails === 'Y');
      body.useJurorEmailDetails = (body.useJurorEmailDetails === 'Y');

      if (body['dobYear'] === null ||  body['dobYear'] === '' ||
          body['dobMonth'] === null || body['dobMonth'] === '' ||
          body['dobDay'] === null || body['dobDay'] === '') {
        body['dob'] = null;
      } else {
        try {
          const dobValue = [body['dobYear'], body['dobMonth'], body['dobDay']].filter(function(val) {
            return val;
          }).join('-');

          body['dob'] = moment(dobValue, 'YYYY-MM-DD').format();
        } catch (err) {
          delete body['dob'];
        } finally {
          delete body['dobYear'];
          delete body['dobMonth'];
          delete body['dobDay'];
        }
      }

      return { uri, body };
    }}
  );

  module.exports.editEligibilityDAO = new DAO('bureau/juror', {
    post: function(jurorNumber, postBody) {
      const uri = urljoin(this.resouce, jurorNumber, 'details', 'eligibility');
      const body = { ...postBody };

      delete body._csrf;

      body.residency = (body.residency === 'Yes');
      body.mentalHealthAct = (body.mentalHealthAct === 'Yes');
      body.bail = (body.bail === 'Yes');
      body.convictions = (body.convictions === 'Yes');

      return { uri, body };
    }}
  );

  module.exports.editDeferralExcusalDAO = new DAO('bureau/juror', {
    post: function(jurorNumber, postBody) {
      const uri = urljoin(this.resource, jurorNumber, 'details', 'excusal');
      const body = {
        version: postBody.version,
        jurorNumber: postBody.jurorNumber,
        notes: postBody.notes,
      };

      if (postBody.confirmedDate === 'Change') {
        body.excusal = 'DEFERRAL';
        body.reason = postBody.deferralReason;
        body.deferralDates = postBody.deferralDates;
      } else if (postBody.confirmedDate === 'No') {
        body.excusal = 'EXCUSAL';
        body.reason = postBody.excusalReason;
      } else {
        body.excusal = 'CONFIRMATION';
      }

      return { uri, body };
    }}
  );

  module.exports.editCjsEmploymentDAO = new DAO('bureau/juror', {
    post: function(jurorNumber, postBody) {
      const uri = urljoin(this.resource, jurorNumber, 'details', 'cjs');
      const body = {
        version: postBody.version,
        jurorNumber: postBody.jurorNumber,
        notes: postBody.notes,
        ncaEmployment: false,
        judiciaryEmployment: false,
        hmctsEmployment: false,
        policeForceDetails: null,
        prisonServiceDetails: null,
        otherDetails: null,
      };

      if (typeof postBody.cjsEmployer === 'string') {
        postBody.cjsEmployer = [postBody.cjsEmployer];
      }

      if (postBody.cjsEmployed !== 'No') {
        body.ncaEmployment = postBody.cjsEmployer.indexOf('National Crime Agency') !== -1;
        body.judiciaryEmployment = postBody.cjsEmployer.indexOf('Judiciary') !== -1;
        body.hmctsEmployment = postBody.cjsEmployer.indexOf('HMCTS') !== -1;
        body.policeForceDetails = (postBody.cjsEmployer.indexOf('Police Force') !== -1)
          ? postBody.cjsPoliceDetails
          : null;
        body.prisonServiceDetails = (postBody.cjsEmployer.indexOf('HM Prison Service') !== -1)
          ? postBody.cjsPrisonDetails
          : null;
        body.otherDetails = (postBody.cjsEmployer.indexOf('Other') !== -1) ? postBody.cjsEmployerDetails : null;
      }

      return { uri, body };
    }}
  );

  module.exports.editReasonableAdjustmentsDAO = new DAO('bureau/juror', {
    post: function(jurorNumber, postBody) {
      const uri = urljoin(this.resource, jurorNumber, 'details', 'special-needs');
      const body = {
        version: postBody.version,
        jurorNumber: postBody.jurorNumber,
        notes: postBody.notes,
      };

      if (typeof postBody.assistanceType === 'string') {
        postBody.assistanceType = [postBody.assistanceType];
      }

      // Transform data as requried
      body.limitedMobility = (postBody.assistanceType.indexOf('Limited mobility') !== -1)
        ? postBody.limitedMobility
        : null;
      body.hearingImpairment = (postBody.assistanceType.indexOf('Hearing impairment') !== -1)
        ? postBody.hearingImpairment
        : null;
      body.diabetes = (postBody.assistanceType.indexOf('Diabetes') !== -1) ? postBody.diabetes : null;
      body.sightImpairment = (postBody.assistanceType.indexOf('Severe sight impairment') !== -1)
        ? postBody.sightImpairment
        : null;
      body.learningDisability = (postBody.assistanceType.indexOf('Learning disability') !== -1)
        ? postBody.learningDisability
        : null;
      body.other = (postBody.assistanceType.indexOf('Other') !== -1) ? postBody.other : null;
      body.specialArrangements = (postBody.specialArrangements.length > 0) ? postBody.specialArrangements : null;

      return { uri, body };
    }}
  );
})();
