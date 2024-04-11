;(function(){
  'use strict';

  var _ = require('lodash')
    , moment = require('moment')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform,
      transform2xxOnly: true,
    }

    , processingStatusMapping = {
      TODO: 'To do',
      AWAITING_CONTACT: 'Awaiting juror',
      AWAITING_COURT_REPLY: 'Awaiting court reply',
      AWAITING_TRANSLATION: 'Awaiting translation',
      CLOSED: 'Completed',
    }

    , statusMapping = {
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
    }

    , transformStrCheck = function(val) {
      if (typeof val === 'undefined' || val === null) {
        return '';
      }

      if (val.replace(/ /g, '').length === 0) {
        return '';
      }

      return val;
    }

    , getSingleTransform = function(body, hasModAccess) {
      var newObj = body;

      newObj.currentOwner = body.current_owner;
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
    }

    , responseObject = {
      resource: 'bureau/juror',
      resourceDetails: (hasModAccess) => {
        if (hasModAccess) {
          return 'moj/juror-record/digital-detail'
        }
        return 'bureau/juror';
      },
      get: function(rp, app, jwtToken, id, hasModAccess = false) {
        var reqOptions = _.clone(options);

        reqOptions.transform = getSingleTransform;
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(reqOptions.uri, this.resourceDetails(hasModAccess), id);

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      getNotes: function(rp, app, jwtToken, id) {
        var reqOptions = _.clone(options);

        reqOptions.transform = utils.basicDataTransform;
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, id, 'notes');

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      putNotes: function(rp, app, jwtToken, id, notes, version) {
        var reqOptions = _.clone(options);

        reqOptions.transform = utils.basicDataTransform;
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'PUT';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, id, 'notes');
        reqOptions.body = { notes: notes, version: version };

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      postPhoneLog: function(rp, app, jwtToken, id, notes) {
        var reqOptions = _.clone(options);

        reqOptions.transform = utils.basicDataTransform;
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, id, 'phone');
        reqOptions.body = { notes: notes };

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      editJurorDetails: function(rp, app, jwtToken, jurorNumber, postBody) {
        var reqOptions = _.clone(options)
          , urlPart = (typeof postBody.thirdPartyFirstName === 'undefined') ? 'first-person' : 'third-party'
          , dobValue;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber, 'details', urlPart);
        reqOptions.body = postBody;

        // Remove unneded data from body
        delete reqOptions.body._csrf;
        delete reqOptions.body.emailAddressConfirmation;

        // Transform data as requried
        postBody.useJurorPhoneDetails = (postBody.useJurorPhoneDetails === 'Y');
        postBody.useJurorEmailDetails = (postBody.useJurorEmailDetails === 'Y');

        // If DOB exists, transform it to single field
        if (postBody['dobYear'] === null ||  postBody['dobYear'] === '' ||
            postBody['dobMonth'] === null || postBody['dobMonth'] === '' ||
            postBody['dobDay'] === null || postBody['dobDay'] === '') {
          postBody['dob'] = null;
        } else {
          try {
            dobValue = [postBody['dobYear'], postBody['dobMonth'], postBody['dobDay']].filter(function(val) {
              return val;
            }).join('-');

            postBody['dob'] = moment(dobValue, 'YYYY-MM-DD').format();
            delete postBody['dobYear'];
            delete postBody['dobMonth'];
            delete postBody['dobDay'];
          } catch (err) {
            delete postBody['dob'];
            delete postBody['dobYear'];
            delete postBody['dobMonth'];
            delete postBody['dobDay'];
          }
        }

        // Log request
        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      editEligibility: function(rp, app, jwtToken, jurorNumber, postBody) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber, 'details', 'eligibility');
        reqOptions.body = postBody;

        // Remove unneded data from body
        delete reqOptions.body._csrf;

        // Transform specific fields
        postBody.residency = (postBody.residency === 'Yes');
        postBody.mentalHealthAct = (postBody.mentalHealthAct === 'Yes');
        postBody.bail = (postBody.bail === 'Yes');
        postBody.convictions = (postBody.convictions === 'Yes');

        return rp(reqOptions);
      },

      editDeferralExcusal: function(rp, app, jwtToken, jurorNumber, postBody) {
        var reqOptions = _.clone(options)
          , tmpBody = {
            version: postBody.version,
            jurorNumber: postBody.jurorNumber,
            notes: postBody.notes,
          };

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber, 'details', 'excusal');

        // Transform data as requried
        if (postBody.confirmedDate === 'Change') {
          tmpBody.excusal = 'DEFERRAL';
          tmpBody.reason = postBody.deferralReason;
          tmpBody.deferralDates = postBody.deferralDates;
        } else if (postBody.confirmedDate === 'No') {
          tmpBody.excusal = 'EXCUSAL';
          tmpBody.reason = postBody.excusalReason;
        } else {
          tmpBody.excusal = 'CONFIRMATION';
        }

        // Set body after transformation
        reqOptions.body = tmpBody;

        // Log request
        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      editCjsEmployment: function(rp, app, jwtToken, jurorNumber, postBody) {
        var reqOptions = _.clone(options)
          , tmpBody = {
            version: postBody.version,
            jurorNumber: postBody.jurorNumber,
            notes: postBody.notes,
          }
          , policeMatch
          , prisonMatch
          , ncaMatch
          , judiciaryMatch
          , hmctsMatch
          , otherMatch;

        // If only one type given, make it an array so the function doesn't loop through the chars of the string
        if (typeof postBody.cjsEmployer === 'string') {
          postBody.cjsEmployer = [postBody.cjsEmployer];
        }

        policeMatch = _.findIndex(postBody.cjsEmployer, function(o) {
          return o === 'Police Force';
        });

        prisonMatch = _.findIndex(postBody.cjsEmployer, function(o) {
          return o === 'HM Prison Service';
        });

        ncaMatch = _.findIndex(postBody.cjsEmployer, function(o) {
          return o === 'National Crime Agency';
        });

        judiciaryMatch = _.findIndex(postBody.cjsEmployer, function(o) {
          return o === 'Judiciary';
        });

        hmctsMatch = _.findIndex(postBody.cjsEmployer, function(o) {
          return o === 'HMCTS';
        });

        otherMatch = _.findIndex(postBody.cjsEmployer, function(o) {
          return o === 'Other';
        });

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber, 'details', 'cjs');

        if (postBody.cjsEmployed === 'No') {
          tmpBody.ncaEmployment = false;
          tmpBody.judiciaryEmployment = false;
          tmpBody.hmctsEmployment = false;
          tmpBody.policeForceDetails = null;
          tmpBody.prisonServiceDetails = null;
          tmpBody.otherDetails = null;
        } else {
          tmpBody.ncaEmployment = ncaMatch !== -1;
          tmpBody.judiciaryEmployment = judiciaryMatch !== -1;
          tmpBody.hmctsEmployment = hmctsMatch !== -1;
          tmpBody.policeForceDetails = (policeMatch !== -1) ? postBody.cjsPoliceDetails : null;
          tmpBody.prisonServiceDetails = (prisonMatch !== -1) ? postBody.cjsPrisonDetails : null;
          tmpBody.otherDetails = (otherMatch !== -1) ? postBody.cjsEmployerDetails : null;
        }

        // Set body after transformation
        reqOptions.body = tmpBody;

        // Log request
        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      editReasonableAdjustments: function(rp, app, jwtToken, jurorNumber, postBody) {
        var reqOptions = _.clone(options)
          , tmpBody = {
            version: postBody.version,
            jurorNumber: postBody.jurorNumber,
            notes: postBody.notes,
          }
          , limitedMobilityMatch
          , hearingImpairmentMatch
          , diabetesMatch
          , sightImpairmentMatch
          , learningDisabilityMatch
          , otherMatch;


        // If only one type give, make it an array
        if (typeof postBody.assistanceType === 'string') {
          postBody.assistanceType = [postBody.assistanceType];
        }

        // Find which are enabled
        limitedMobilityMatch = _.findIndex(postBody.assistanceType, function(o) {
          return o === 'Limited mobility';
        });

        hearingImpairmentMatch = _.findIndex(postBody.assistanceType, function(o) {
          return o === 'Hearing impairment';
        });

        diabetesMatch = _.findIndex(postBody.assistanceType, function(o) {
          return o === 'Diabetes';
        });

        sightImpairmentMatch = _.findIndex(postBody.assistanceType, function(o) {
          return o === 'Severe sight impairment';
        });

        learningDisabilityMatch = _.findIndex(postBody.assistanceType, function(o) {
          return o === 'Learning disability';
        });

        otherMatch = _.findIndex(postBody.assistanceType, function(o) {
          return o === 'Other';
        });


        // Set initial request options
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber, 'details', 'special-needs');

        // Transform data as requried
        tmpBody.limitedMobility = (limitedMobilityMatch !== -1) ? postBody.limitedMobility : null;
        tmpBody.hearingImpairment = (hearingImpairmentMatch !== -1) ? postBody.hearingImpairment : null;
        tmpBody.diabetes = (diabetesMatch !== -1) ? postBody.diabetes : null;
        tmpBody.sightImpairment = (sightImpairmentMatch !== -1) ? postBody.sightImpairment : null;
        tmpBody.learningDisability = (learningDisabilityMatch !== -1) ? postBody.learningDisability : null;
        tmpBody.other = (otherMatch !== -1) ? postBody.other : null;
        tmpBody.specialArrangements = (postBody.specialArrangements.length > 0) ? postBody.specialArrangements : null;

        // Set body after transformation
        reqOptions.body = tmpBody;

        // Log request
        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.object = responseObject;

})();
