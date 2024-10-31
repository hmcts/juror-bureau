const { post } = require('request');

;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

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
    resource: 'bureau/juror',
    resourceDetails: 'moj/juror-record/digital-detail',

    get: function(req, id) {
      const dao = new DAO(urljoin(this.resourceDetails, id), {
        get: function() {
          return {
            uri: this.resource,
            transform: getSingleTransform,
          }
        }
      });

      return dao.get(req);
    },

    getNotes: function(req, id) {
      const dao = new DAO(urljoin(this.resource, id, 'notes'), {
        get: function() {
          return {
            uri: this.resource,
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.get(req);
    },

    putNotes: function(req, id, notes, version) {
      const dao = new DAO(urljoin(this.resource, id, 'notes'), {
        put: function(notes, version) {
          return {
            uri: this.resource,
            body: {
              notes,
              version,
            },
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.put(req, notes, version);
    },

    postPhoneLog: function(req, id, notes) {
      const dao = new DAO(urljoin(this.resource, id, 'phone'), {
        post: function(notes) {
          return {
            uri: this.resource,
            body: {
              notes,
            },
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.post(req, notes);
    },

    editJurorDetails: function(req, jurorNumber, postBody) {
      const urlPart = (typeof postBody.thirdPartyFirstName === 'undefined') ? 'first-person' : 'third-party'
      let dobValue;
      const uri = urljoin(this.resource, jurorNumber, 'details', urlPart);
      let body = postBody;

      // Remove unneded data from body
      delete body._csrf;
      delete body.emailAddressConfirmation;

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

      const dao = new DAO(uri, {
        post: function(body) {
          return {
            uri: this.resource,
            body,
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.post(req, body);
    },

    editEligibility: function(req, jurorNumber, postBody) {
      const uri = urljoin(this.resource, jurorNumber, 'details', 'eligibility');

      // Transform specific fields
      postBody.residency = (postBody.residency === 'Yes');
      postBody.mentalHealthAct = (postBody.mentalHealthAct === 'Yes');
      postBody.bail = (postBody.bail === 'Yes');
      postBody.convictions = (postBody.convictions === 'Yes');

      const dao = new DAO(uri, {
        post: function(body) {
          return {
            uri: this.resource,
            body,
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.post(req, postBody);
    },

    editDeferralExcusal: function(req, jurorNumber, postBody) {
      const uri = urljoin(this.resource, jurorNumber, 'details', 'excusal');

      const body = {
        version: postBody.version,
        jurorNumber: postBody.jurorNumber,
        notes: postBody.notes,
      };

      // Transform data as requried
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

      const dao = new DAO(uri, {
        post: function(body) {
          return {
            uri: this.resource,
            body: body,
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.post(req, body);
    },

    editCjsEmployment: function(req, jurorNumber, postBody) {
      const uri = urljoin(this.resource, jurorNumber, 'details', 'cjs');
      const tmpBody = {
        version: postBody.version,
        jurorNumber: postBody.jurorNumber,
        notes: postBody.notes,
      }
      let policeMatch
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

      const dao = new DAO(uri, {
        post: function(body) {
          return {
            uri: this.resource,
            body,
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.post(req, tmpBody);
    },

    editReasonableAdjustments: function(req, jurorNumber, postBody) {
      const uri = urljoin(this.resource, jurorNumber, 'details', 'special-needs');

      const tmpBody = {
        version: postBody.version,
        jurorNumber: postBody.jurorNumber,
        notes: postBody.notes,
      };

      let limitedMobilityMatch
        , hearingImpairmentMatch
        , diabetesMatch
        , sightImpairmentMatch
        , learningDisabilityMatch
        , otherMatch;

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

      // Transform data as requried
      tmpBody.limitedMobility = (limitedMobilityMatch !== -1) ? postBody.limitedMobility : null;
      tmpBody.hearingImpairment = (hearingImpairmentMatch !== -1) ? postBody.hearingImpairment : null;
      tmpBody.diabetes = (diabetesMatch !== -1) ? postBody.diabetes : null;
      tmpBody.sightImpairment = (sightImpairmentMatch !== -1) ? postBody.sightImpairment : null;
      tmpBody.learningDisability = (learningDisabilityMatch !== -1) ? postBody.learningDisability : null;
      tmpBody.other = (otherMatch !== -1) ? postBody.other : null;
      tmpBody.specialArrangements = (postBody.specialArrangements.length > 0) ? postBody.specialArrangements : null;

      const dao = new DAO(uri, {
        post: function(body) {
          return {
            uri: this.resource,
            body,
            transform: utils.basicDataTransform,
          }
        }
      });

      return dao.post(req, tmpBody);
    }
  };

})();
