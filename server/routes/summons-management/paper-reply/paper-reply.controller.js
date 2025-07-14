(function() {
  'use strict';

  const _ = require('lodash')
    , modUtils = require('../../../lib/mod-utils')
    , moment = require('moment')
    , dateFilter = require('../../../components/filters').dateFilter
    , paperReplyObjectObj = require('../../../objects/paper-reply').paperReplyObject
    , getJurorDetailsObj = require('../../../objects/juror-record').record
    , { changeName: fixNameObj } = require('../../../objects/juror-record')
    , { systemCodesDAO } = require('../../../objects/administration')
    , paperReplyValidator = require('../../../config/validation/paper-reply')
    , { updateStatus } = require('../../../objects/summons-management')
    , validate = require('validate.js')
    , { isCourtUser, isTeamLeader } = require('../../../components/auth/user-type');

  const countErrors = (tmpErrors) => typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0;
  const parseError = (err) => (typeof err.error !== 'undefined') ? err.error : err.toString();

  // this middleware checks if the user has already started a paper reply
  // caching the pool details on the session object helps with that
  // it allows us to have a multi step form for a paper reply
  module.exports.hasStartedRequest = function(app) {
    return function(req, res, next) {
      if (typeof req.session.startedPaperResponse === 'undefined') {
        return res.redirect(app.namedRoutes.build('paper-reply.index.get', {
          id: req.params['id'],
        }));
      }

      next();
    };
  };

  module.exports.getIndex = function(app) {
    return function(req, res) {
      var successCB = function(response = {}) {
          var details
            , tmpErrors;

          if (response.hasOwnProperty('data')) {

            app.logger.info('Fetched the juror record: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: response.data,
            });

            details = _.clone(response.data);
            details.jurorNumber = details.commonDetails.jurorNumber;
            details.title = details.commonDetails.title;
            details.firstName = details.commonDetails.firstName;
            details.lastName = details.commonDetails.lastName;
            details.startDate = details.commonDetails.startDate;
            details.isWelshCourt = details.commonDetails.is_welsh_court;

            // the date of birth comes as a timestamp so we convert to a date object
            details.dateOfBirth = details.dateOfBirth
              ? dateFilter(new Date(details.dateOfBirth), null, 'DD/MM/YYYY')
              : '';

            details.postcode = details.addressPostcode;

            delete details.commonDetails;

            // add current juror details to session to allow for caching purposes
            req.session.paperResponseDetails = details;
          }

          if (req.session.paperResponseDetails.fixedName) {
            const { title, firstName, lastName } = req.session.paperResponseDetails.fixedName;

            req.session.paperResponseDetails.title = title;
            req.session.paperResponseDetails.firstName = firstName;
            req.session.paperResponseDetails.lastName = lastName;
          }

          tmpErrors = _.clone(req.session.errors);
          delete req.session.errors;
          delete req.session.formFields;

          let isThirdPartyResponse = false;
          if (req.session.paperResponseDetails.thirdParty) {
            isThirdPartyResponse = typeof req.session.paperResponseDetails.thirdParty.thirdPartyFName !== 'undefined'
              || typeof req.session.paperResponseDetails.thirdParty.thirdPartyLName !== 'undefined'
              || typeof req.session.paperResponseDetails.thirdParty.thirdPartyPhone !== 'undefined'
              || typeof req.session.paperResponseDetails.thirdParty.otherPhone !== 'undefined'
              || typeof req.session.paperResponseDetails.thirdParty.thirdPartyEmail !== 'undefined'
              || typeof req.session.paperResponseDetails.thirdParty.relationship !== 'undefined'
              || typeof req.session.paperResponseDetails.thirdParty.thirdPartyReason !== 'undefined';
          }

          return res.render('summons-management/paper-reply/index', {
            details: req.session.paperResponseDetails,
            cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: req.params['id'],
            }),
            postUrl: app.namedRoutes.build('paper-reply.index.post', {
              id: req.params['id'],
            }),
            dateMax: dateFilter(moment().subtract(1, 'days'), null, 'DD/MM/YYYY'),
            errors: {
              title: 'Please check the form',
              count: countErrors(tmpErrors),
              items: tmpErrors,
            },
            isCourtUser: isCourtUser(req),
            isTeamLeader: isTeamLeader(req),
            noWelsh: !req.session.paperResponseDetails.isWelshCourt,
            isThirdPartyResponse,
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch juror record: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['id'],
            },
            error: parseError(err),
          });

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params['id'],
          }));
        };

      if (typeof req.session.paperResponseDetails !== 'undefined'
        && req.session.paperResponseDetails.jurorNumber !== req.params['id']) {
        delete req.session.startedPaperResponse;
        delete req.session.paperResponseDetails;
      } else if (typeof req.session.paperResponseDetails !== 'undefined'
        && req.session.paperResponseDetails.jurorNumber === req.params['id']) {
        return successCB();
      }

      return getJurorDetailsObj.get(
        req,
        'detail',
        req.params['id'],
        req.session.locCode
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postIndex = function(app) {
    return function(req, res) {
      let tempThirdParty = {};
      let tmpAge;
      let otherThirdPartyReason = false;
      let momentSst = moment();

      app.logger.debug('Adding a new paper summons: POST step-01 - juror details', {
        data: req.body,
        jurorNumber: req.session.paperResponseDetails.jurorNumber,
      });

      // Validate form submission
      let detailsValidatorResult;
      detailsValidatorResult = validate(req.body, paperReplyValidator.jurorDetails());

      req.session.startedPaperResponse = true;

      // build thirdParty Object if any detail in the relationship field
      const isThirdParty = !(req.body.relationship === '' || req.body.relationship === null)
        || !(req.body.thirdPartyReason === '' || req.body.thirdPartyReason === null || !req.body.thirdPartyReason)
        || !(req.body.thirdPartyFName === '' || req.body.thirdPartyFName === null)
        || !(req.body.thirdPartyLName === '' || req.body.thirdPartyLName === null)
        || !(req.body.thirdPartyMainPhone === '' || req.body.thirdPartyMainPhone === null)
        || !(req.body.thirdPartyEmailAddress === '' || req.body.thirdPartyEmailAddress === null)
        || !(req.body.thirdPartyOtherPhone === '' || req.body.thirdPartyOtherPhone === null);

      let thirdPartyValidatorResult;
      if (req.body.thirdPartyEnabled === 'yes' && isThirdParty) {
        thirdPartyValidatorResult = validate(req.body, paperReplyValidator.thirdParty());
        // build thirdParty Object if any detail in the relationship field
        tempThirdParty.relationship = req.body.relationship;
        if (req.body.thirdPartyReason === 'other') {
          tempThirdParty.thirdPartyReason = req.body.otherDetails;
          otherThirdPartyReason = true;
        } else {
          tempThirdParty.thirdPartyReason = req.body.thirdPartyReason;
        }
        tempThirdParty.thirdPartyFName = req.body.thirdPartyFName;
        tempThirdParty.thirdPartyLName = req.body.thirdPartyLName;
        tempThirdParty.thirdPartyPhone = req.body.thirdPartyMainPhone;
        tempThirdParty.otherPhone = req.body.thirdPartyOtherPhone;
        tempThirdParty.thirdPartyEmail = req.body.thirdPartyEmailAddress;
        tempThirdParty.useJurorEmailDetails = req.body.thirdPartyContactPreferences?.includes('useJurorEmailDetails') ? true : false;
        tempThirdParty.useJurorPhoneDetails = req.body.thirdPartyContactPreferences?.includes('useJurorPhoneDetails') ? true : false;
      } else  {
        tempThirdParty = {};
      }

      req.session.paperResponseDetails.thirdParty = tempThirdParty;
      req.session.paperResponseDetails.primaryPhone = req.body.primaryPhone;
      req.session.paperResponseDetails.secondaryPhone = req.body.secondaryPhone;
      req.session.paperResponseDetails.emailAddress = req.body.emailAddress;
      req.session.paperResponseDetails.otherThirdPartyReason = otherThirdPartyReason;
      req.session.paperResponseDetails.welsh = !!req.body.welsh;

      req.session.paperResponseDetails.dateOfBirth = req.body.dateOfBirth;

      if (typeof detailsValidatorResult !== 'undefined' || typeof thirdPartyValidatorResult !== 'undefined') {
        const validatorResult = { ...detailsValidatorResult, ...thirdPartyValidatorResult };
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('paper-reply.index.get', {
          id: req.params['id'],
        }));
      }

      tmpAge = modUtils.dateDifference(
        dateFilter(req.session.paperResponseDetails.startDate, 'YYYY/MM/DD', 'DD/MM/YYYY'),
        req.body.dateOfBirth,
        'years'
      );

      if (tmpAge < 18 || tmpAge > 75) {
        req.session.paperResponseDetails.yearsOld = tmpAge;

        return res.redirect(app.namedRoutes.build('paper-reply.ineligible-age.get', {
          id: req.params['id'],
        }));
      }

      return res.redirect(app.namedRoutes.build('paper-reply.eligibility.get', {
        id: req.params['id'],
      }));
    };
  };

  module.exports.getEligibility = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      return res.render('summons-management/paper-reply/eligibility', {
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['id'],
        }),
        postUrl: app.namedRoutes.build('paper-reply.eligibility.post', {
          id: req.params['id'],
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('paper-reply.index.get', {
            id: req.params['id'],
          }),
        },
        eligibilityDetails: eligibilityDetails(req.session.paperResponseDetails.eligibility),
        errors: {
          title: 'Please check the form',
          count: countErrors(tmpErrors),
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postEligibility = function(app) {
    return function(req, res) {
      req.session.paperResponseDetails.eligibility = createEligibilityObject(req.body);

      const validatorResult = validate(req.body, paperReplyValidator.eligibility());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('paper-reply.eligibility.get', {
          id: req.params['id'],
        }));
      }

      mergeMentalHealthInfo(req.session.paperResponseDetails.eligibility);

      app.logger.debug('Adding a new paper summons: POST step-02 - eligibility', {
        data: req.body,
        jurorNumber: req.session.paperResponseDetails.jurorNumber,
      });

      return res.redirect(app.namedRoutes.build('paper-reply.reply-types.get', {
        id: req.params['id'],
      }));
    };
  };

  module.exports.getIneligibleAge = function(app) {
    return function(req, res) {
      var result = eligibilityDetails(req.session.paperResponseDetails.eligibility);

      return res.render('summons-management/paper-reply/ineligible-age', {
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['id'],
        }),
        postUrl: app.namedRoutes.build('paper-reply.ineligible-age.post', {
          id: req.params['id'],
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('paper-reply.index.get', {
            id: req.params['id'],
          }),
        },
        dob: req.session.paperResponseDetails.dateOfBirth,
        yearsOld: req.session.paperResponseDetails.yearsOld,
        livedConsecutive: result.livedConsecutive,
        mentalHealthAct: result.mentalHealthAct,
        mentalHealthCapacity: result.mentalHealthCapacity,
        onBail: result.onBail,
        convicted: result.convicted,
      });
    };
  };

  module.exports.postIneligibleAge = function(app) {

    return function(req, res) {
      var successCB = function() {

          app.logger.info('Successfully disqualified juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.session.paperResponseDetails,
          });

          const jurorName = [req.session.paperResponseDetails.title,
            req.session.paperResponseDetails.firstName,
            req.session.paperResponseDetails.lastName].join(' ');

          req.session.responseWasActioned = {
            jurorDetails: {
              jurorName: jurorName,
              jurorNumber: req.session.paperResponseDetails.jurorNumber,
            },
            type: 'Disqualified (age)',
          };

          delete req.session.startedPaperResponse;
          delete req.session.paperResponseDetails;

          return res.redirect(app.namedRoutes.build('inbox.todo.get'));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to disqualify juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.session.paperResponseDetails,
            error: parseError(err),
          });

          req.session.error = err.error;

          return res.redirect(app.namedRoutes.build('paper-reply.index.get', {
            id: req.params['id'],
          }));
        };

      if (req.body.signed !== '') {
        if (req.body.signed === 'yes') {
          req.session.paperResponseDetails.signed = true;
        }
        if (req.body.signed === 'no') {
          req.session.paperResponseDetails.signed = false;
        }
      }

      paperReplyObjectObj.post(req, req.session.paperResponseDetails)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getReplyTypes = function(app) {
    return function(req, res) {
      let deferralValue;

      if (req.session.paperResponseDetails.canServeOnSummonsDate) {
        deferralValue = 'can-serve';
      }

      if (req.session.paperResponseDetails.deferral) {
        deferralValue = 'deferral-request';
      }

      if (req.session.paperResponseDetails.excusal) {
        deferralValue = 'excusal-request';
      }

      return res.render('summons-management/paper-reply/reply-types', {
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['id'],
        }),
        postUrl: app.namedRoutes.build('paper-reply.reply-types.post', {
          id: req.params['id'],
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('paper-reply.eligibility.get', {
            id: req.params['id'],
          }),
        },
        deferralValue,
      });
    };
  };

  module.exports.postReplyTypes = function(app) {
    return function(req, res) {
      // this will default to false always and only when 'can-serve' is selected we then set it to true
      // ... also the backend dont accept a null value for this :-)
      req.session.paperResponseDetails.canServeOnSummonsDate = false;

      switch (req.body.deferralValue) {
      case 'can-serve':
        req.session.paperResponseDetails.canServeOnSummonsDate = true;
        req.session.paperResponseDetails.deferral = false;
        req.session.paperResponseDetails.excusal = false;
        break;
      case 'deferral-request':
        req.session.paperResponseDetails.deferral = true;
        req.session.paperResponseDetails.excusal = false;
        break;
      case 'excusal-request':
        req.session.paperResponseDetails.deferral = false;
        req.session.paperResponseDetails.excusal = true;
        break;
      }

      app.logger.debug('Adding a new paper summons: POST step-03 - reply types', {
        data: req.body,
        jurorNumber: req.session.paperResponseDetails.jurorNumber,
      });

      return res.redirect(app.namedRoutes.build('paper-reply.cjs-employment.get', {
        id: req.params['id'],
      }));
    };
  };

  module.exports.getCjsEmployment = function(app) {
    return function(req, res) {
      var cjsEmploymentResponse =
        (req.session.paperResponseDetails && req.session.paperResponseDetails.cjsEmploymentResponse !== 'undefined')
          ? req.session.paperResponseDetails.cjsEmploymentResponse : false,
        cjsSystemOptionsPoliceChecked = req.session.paperResponseDetails.cjsSystemOptionsPoliceChecked === 'yes',
        cjsSystemOptionsPrisonChecked = req.session.paperResponseDetails.cjsSystemOptionsPrisonChecked === 'yes',
        cjsSystemOptionsCrimeChecked = req.session.paperResponseDetails.cjsSystemOptionsCrimeChecked === 'yes',
        cjsSystemOptionsJudiciaryChecked = req.session.paperResponseDetails.cjsSystemOptionsJudiciaryChecked === 'yes',
        cjsSystemOptionsCourtsChecked = req.session.paperResponseDetails.cjsSystemOptionsCourtsChecked === 'yes',
        cjsSystemOptionsOtherChecked = req.session.paperResponseDetails.cjsSystemOptionsOtherChecked === 'yes'
        , cjsEmploymentValues = {}
        , tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;
      delete req.session.formFields;

      if (typeof req.session.paperResponseDetails.cjsEmployment !== 'undefined') {
        // eslint-disable-next-line vars-on-top, one-var
        var i = 0;

        for (i; i < req.session.paperResponseDetails.cjsEmployment.length; i++) {
          cjsEmploymentValues[req.session.paperResponseDetails.cjsEmployment[i].cjsEmployer.toLowerCase()] =
            req.session.paperResponseDetails.cjsEmployment[i].cjsEmployerDetails;
        }
      }

      return res.render('summons-management/paper-reply/cjs-employment', {
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['id'],
        }),
        postUrl: app.namedRoutes.build('paper-reply.cjs-employment.post', {
          id: req.params['id'],
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('paper-reply.reply-types.get', {
            id: req.params['id'],
          }),
        },
        cjsEmploymentChecked: req.session.paperResponseDetails.cjsEmploymentChecked,
        cjsEmploymentValues,
        cjsEmploymentResponse,
        cjsSystemOptionsPoliceChecked,
        cjsSystemOptionsPrisonChecked,
        cjsSystemOptionsCrimeChecked,
        cjsSystemOptionsJudiciaryChecked,
        cjsSystemOptionsCourtsChecked,
        cjsSystemOptionsOtherChecked,
        errors: {
          title: 'Please check the form',
          count: countErrors(tmpErrors),
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postCjsEmployment = function(app) {
    return function(req, res) {
      var cjsEmploymentResponse =
        (req.body.cjsEmploymentResponse === 'yes' || req.body.cjsEmploymentResponse === true)
        , emplTemp = []
        , validatorResult;

      req.session.paperResponseDetails.cjsSystemOptionsPoliceChecked =
            (
              req.body.cjsSystemOptionsPolice &&
              req.body.cjsSystemOptionsPolice === 'police force' &&
              cjsEmploymentResponse
            ) ? 'yes' : 'no';
      req.session.paperResponseDetails.cjsSystemOptionsPrisonChecked =
            (
              req.body.cjsSystemOptionsPrison &&
              req.body.cjsSystemOptionsPrison === 'hm prison service' &&
              cjsEmploymentResponse
            ) ? 'yes' : 'no';
      req.session.paperResponseDetails.cjsSystemOptionsCrimeChecked =
            (
              req.body.cjsSystemOptionsCrime &&
              req.body.cjsSystemOptionsCrime === 'national crime agency' &&
              cjsEmploymentResponse
            ) ? 'yes' : 'no';
      req.session.paperResponseDetails.cjsSystemOptionsJudiciaryChecked =
            (
              req.body.cjsSystemOptionsJudiciary &&
              req.body.cjsSystemOptionsJudiciary === 'judiciary' &&
              cjsEmploymentResponse
            ) ? 'yes' : 'no';
      req.session.paperResponseDetails.cjsSystemOptionsCourtsChecked =
            (
              req.body.cjsSystemOptionsCourts &&
              req.body.cjsSystemOptionsCourts === 'hm courts and tribunal service' &&
              cjsEmploymentResponse
            ) ? 'yes' : 'no';
      req.session.paperResponseDetails.cjsSystemOptionsOtherChecked =
            (
              req.body.cjsSystemOptionsOther &&
              req.body.cjsSystemOptionsOther === 'other' &&
              cjsEmploymentResponse
            ) ? 'yes' : 'no';

      // clear the text values if needed and build the cjsEmployment array
      if (req.session.paperResponseDetails.cjsSystemOptionsPoliceChecked !== 'yes') {
        req.session.paperResponseDetails.cjsSystemPoliceDetails = '';
      } else {
        emplTemp.push({
          'cjsEmployer': 'Police Force',
          'cjsEmployerDetails': req.body.cjsSystemPoliceDetails,
        });
      };
      if (req.session.paperResponseDetails.cjsSystemOptionsPrisonChecked !== 'yes') {
        req.session.paperResponseDetails.cjsSystemHmPrisonDetails = '';
      } else {
        emplTemp.push({
          'cjsEmployer': 'HM Prison Service',
          'cjsEmployerDetails': req.body.cjsSystemHmPrisonDetails,
        });
      };
      if (req.session.paperResponseDetails.cjsSystemOptionsCrimeChecked !== 'yes') {
        req.session.paperResponseDetails.cjsSystemNationalCrimeDetails = '';
      } else {
        emplTemp.push({
          'cjsEmployer': 'National Crime Agency',
          'cjsEmployerDetails': req.body.cjsSystemNationalCrimeDetails,
        });
      };
      if (req.session.paperResponseDetails.cjsSystemOptionsJudiciaryChecked !== 'yes') {
        req.session.paperResponseDetails.cjsSystemJudiciaryDetails = '';
      } else {
        emplTemp.push({
          'cjsEmployer': 'Judiciary',
          'cjsEmployerDetails': req.body.cjsSystemJudiciaryDetails,
        });
      };
      if (req.session.paperResponseDetails.cjsSystemOptionsCourtsChecked !== 'yes') {
        req.session.paperResponseDetails.cjsSystemCourtsDetails = '';
      } else {
        emplTemp.push({
          'cjsEmployer': 'HMCTS',
          'cjsEmployerDetails': req.body.cjsSystemCourtsDetails,
        });
      };
      if (req.session.paperResponseDetails.cjsSystemOptionsOtherChecked !== 'yes') {
        req.session.paperResponseDetails.cjsSystemOtherDetails = '';
      } else {
        emplTemp.push({
          'cjsEmployer': 'Other',
          'cjsEmployerDetails': req.body.cjsSystemOtherDetails,
        });
      };
      req.session.paperResponseDetails.cjsEmployment = emplTemp;

      if (req.body.cjsEmploymentResponse !== '') {
        req.session.paperResponseDetails.cjsEmploymentChecked = {
          value: req.body.cjsEmploymentResponse,
        };
      } else {
        req.session.paperResponseDetails.cjsEmploymentChecked = false;
      }

      app.logger.debug('Adding a new paper summons: POST step-04 - cjs employment', {
        data: req.body,
        jurorNumber: req.session.paperResponseDetails.jurorNumber,
      });

      validatorResult = validate(req.body, paperReplyValidator.cjsEmployment());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('paper-reply.cjs-employment.get', {
          id: req.params['id'],
        }));
      }

      return res.redirect(app.namedRoutes.build('paper-reply.adjustments.get', {
        id: req.params['id'],
      }));
    };
  };

  module.exports.getAdjustments = function(app) {
    return async function(req, res) {
      var specialNeeds = []
        , assistanceType
        , assistanceTypeDetails
        , adjustmentsResponse
        , reasons = []
        , tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;
      delete req.session.formFields;

      if (req.session.paperResponseDetails.specialNeeds) {
        specialNeeds = req.session.paperResponseDetails.specialNeeds;
      }

      if (specialNeeds.length > 0) {
        assistanceType = specialNeeds[0].assistanceType;
        assistanceTypeDetails = specialNeeds[0].assistanceTypeDetails;
      }

      if (typeof req.session.paperResponseDetails.adjustments !== 'undefined') {
        adjustmentsResponse = {
          checked: req.session.paperResponseDetails.adjustments.checked,
          value: req.session.paperResponseDetails.adjustments.value,
        };
      }

      try {
        let adjustmentsReasons = modUtils.reasonsArrToObj(await systemCodesDAO.get(req, 'REASONABLE_ADJUSTMENTS'));

        Object.keys(adjustmentsReasons).forEach((key) => {
          reasons.push(
            {
              value: key,
              text: adjustmentsReasons[key],
              selected: key === assistanceType,
            });
        });

        return res.render('summons-management/paper-reply/adjustments', {
          cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params['id'],
          }),
          postUrl: app.namedRoutes.build('paper-reply.adjustments.post', {
            id: req.params['id'],
          }),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('paper-reply.cjs-employment.get', {
              id: req.params['id'],
            }),
          },
          adjustmentsResponse,
          assistanceTypeDetails,
          specialNeeds,
          reasons,
          errors: {
            title: 'Please check the form',
            count: countErrors(tmpErrors),
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to retrieve juror details: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber: req.params['jurorNumber'],
            locCode: req.session.locCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic', { err });
      };
    };
  };

  module.exports.postAdjustments = function(app) {
    return function(req, res) {
      var specialNeeds = []
        , validatorResult;

      if (req.body.adjustmentsResponse !== 'yes' || !req.body.adjustmentsResponse) {
        req.body.adjustmentsReason = '';
        req.body.assistanceTypeDetails = '';
      } else {
        specialNeeds.push({
          'assistanceType': req.body.adjustmentsReason,
          'assistanceTypeDetails': req.body.assistanceTypeDetails,
        });
      }

      if (specialNeeds.length > 0) {
        req.session.paperResponseDetails.specialNeeds = specialNeeds;
      } else {
        req.session.paperResponseDetails.specialNeeds = [];
      }

      if (req.body.adjustmentsResponse !== '') {
        req.session.paperResponseDetails.adjustments = {
          checked: true,
          value: req.body.adjustmentsResponse,
        };
      } else {
        req.session.paperResponseDetails.adjustments = {
          checked: false,
        };
      }

      app.logger.debug('Adding a new paper summons: POST step-05 - reasonable adjustments', {
        data: req.body,
        jurorNumber: req.session.paperResponseDetails.jurorNumber,
      });

      validatorResult = validate(req.body, paperReplyValidator.reasonableAdjustments());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('paper-reply.adjustments.get', {
          id: req.params['id'],
        }));
      }

      return res.redirect(app.namedRoutes.build('paper-reply.signature.get', {
        id: req.params['id'],
      }));
    };
  };

  module.exports.getSignature = function(app) {
    return function(req, res) {
      var signed =
        (req.session.paperResponseDetails && req.session.paperResponseDetails.signed !== 'undefined')
          ? req.session.paperResponseDetails.signed : false
        , tmpError = _.clone(req.session.error);

      delete req.session.error;

      return res.render('summons-management/paper-reply/signature', {
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['id'],
        }),
        postUrl: app.namedRoutes.build('paper-reply.signature.post', {
          id: req.params['id'],
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('paper-reply.adjustments.get', {
            id: req.params['id'],
          }),
        },
        signed,
        error: tmpError,
      });
    };
  };

  module.exports.postSignature = function(app) {
    return async function(req, res) {
      var successCB = function(paperSummonsData) {

          app.logger.info('Successfully added a new paper response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              response: req.session.paperResponseDetails,
              ...paperSummonsData,
            },
          });

          let tmpDetails = {
            jurorNumber: req.params['id'],
            jurorName: {
              title: req.session.paperResponseDetails.title,
              firstName: req.session.paperResponseDetails.firstName,
              lastName: req.session.paperResponseDetails.lastName,
            },
          };

          delete req.session.startedPaperResponse;
          delete req.session.paperResponseDetails;

          if (paperSummonsData.straightThroughAcceptance) {

            app.logger.debug('Processing paper-response straight-through: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                response: req.params['id'],
              },
            });

            req.session.straightThroughData = {
              jurorDetails: {
                ...tmpDetails,
              },
            };

            return res.redirect(app.namedRoutes.build('paper-reply.straight-through.get', {
              id: req.params['id'],
            }));
          }

          return res.redirect(app.namedRoutes.build('response.paper.details.get', {
            type: 'paper',
            id: req.params['id'],
          }));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to add the paper response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.session.paperResponseDetails,
            error: parseError(err),
          });

          req.session.error = err.error;

          return res.redirect(app.namedRoutes.build('paper-reply.signature.get', {
            id: req.params['id'],
          }));
        };

      if (req.body.signed !== '') {
        if (req.body.signed === 'yes') {
          req.session.paperResponseDetails.signed = true;
        }
        if (req.body.signed === 'no') {
          req.session.paperResponseDetails.signed = false;
        }
      }

      if (req.session.paperResponseDetails.fixedName) {
        try {
          await fixNameObj.patch(
            req,
            req.params['id'],
            'fix-name',
            req.session.paperResponseDetails.fixedName,
          );
        } catch (err) {
          app.logger.crit('Failed to fix current name: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.session.paperResponseDetails.fixedName,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        }
      }

      paperReplyObjectObj.post(
        req,
        req.session.paperResponseDetails
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getStraightThrough = function(app) {
    return function(req, res) {

      if (req.query.action === 'skip') {

        delete req.session.straightThroughData;

        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }

      return res.render('summons-management/paper-reply/straight-through.njk', {
        response: req.params['id'],
      });
    };
  };

  module.exports.postStraightThrough = function(app) {
    return function(req, res) {
      if (req.body.response !== req.params['id']) {
        app.logger.crit('Response id and url parameters do not match: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            urlResponseId: req.params['id'],
            formResponseId: req.body.response,
          },
          error: 'The url id parameter does not match the response id that was submitted with the form',
        });

        return res.render('_errors/generic', { 
          err: {
            message: 'The url id parameter does not match the response id that was submitted with the form',
          } 
        });
      }

      return updateStatus.put(
        req,
        req.body.response,
        'CLOSED')
        .then(() => {

          app.logger.info('Successfully processed the response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              response: req.params['id'],
            },
          });

          req.session.responseWasActioned = {
            jurorDetails: {
              jurorNumber: req.session.straightThroughData.jurorDetails.jurorNumber,
              jurorName: nameReducer(req.session.straightThroughData.jurorDetails.jurorName),
            },
            type: 'Responded',
          };

          delete req.session.straightThroughData;

          return res.redirect(app.namedRoutes.build('inbox.todo.get'));
        })
        .catch((err) => {
          app.logger.crit('Failed to process the response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              response: req.params['id'],
            },
            error: parseError(err),
          });

          return res.render('_errors/generic', { err });
        });
    };
  };

  function nameReducer(name) {
    return Object.values(name)
      .reduce((newName, namePart) => {
        if (namePart === null) return newName;
        let tmpName = newName + `${namePart} `;

        return tmpName;
      }, '').trim();
  }

  module.exports.getEditName = function(app) {
    return function(req, res) {
      const details = _.clone(req.session.paperResponseDetails)
        , jurorDetails = {}
        , tmpErrors = _.clone(req.session.errors)
        , tmpData = _.clone(req.session.formFields) || {}
        , { action } = req.query;

      delete req.session.errors;
      delete req.session.formFields;

      jurorDetails.jurorNumber = details.jurorNumber;
      jurorDetails.title = typeof tmpData.title !== 'undefined' ? tmpData.title : details.title;
      jurorDetails.firstName = typeof tmpData.firstName !== 'undefined' ? tmpData.firstName : details.firstName;
      jurorDetails.lastName = typeof tmpData.lastName !== 'undefined' ? tmpData.lastName : details.lastName;

      return res.render('summons-management/paper-reply/edit-name', {
        jurorDetails: jurorDetails,
        postUrl: app.namedRoutes.build('paper-reply.edit-name.post', {
          id: jurorDetails.jurorNumber,
        }) + `?action=${action}`,
        cancelUrl: app.namedRoutes.build('paper-reply.index.get', {
          id: jurorDetails.jurorNumber,
        }),
        errors: {
          title: 'Please check the form',
          count: countErrors(tmpErrors),
          items: tmpErrors,
        },
        action,
      });
    };
  };

  module.exports.postEditName = function(app) {
    return async function(req, res) {
      const { action } = req.query;
      const validatorResult = validate(req.body, paperReplyValidator.jurorName());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('paper-reply.edit-name.get', {
          id: req.params['id'],
        }) + `?action=${action}`);
      }

      const { title, firstName, lastName } = req.body;

      // fixing a name will only modify the original name
      if (action === 'fix') {
        req.session.paperResponseDetails.fixedName = {
          title,
          firstName,
          lastName,
        };
      }

      // adding a new name is a different procedure, we keep the original and new names during the journey
      // when submitting, we need to submit the new name only
      if (action === 'new') {
        req.session.paperResponseDetails.pendingTitle = title;
        req.session.paperResponseDetails.pendingFirstName = firstName;
        req.session.paperResponseDetails.pendingLastName = lastName;
      }

      return res.redirect(app.namedRoutes.build('paper-reply.index.get', {
        id: req.params.id,
      }));
    };
  };

  module.exports.getEditAddress = function(app) {
    return function(req, res) {

      let paperDetails = req.session.paperResponseDetails
        , address = {}
        , tmpErrors = _.clone(req.session.errors)
        , tmpData = _.clone(req.session.formFields) || {};

      address.postcode = req.session.paperResponseDetails.addressPostcode;

      address.part1 = typeof tmpData.address1 !== 'undefined' ? tmpData.address1 : paperDetails.addressLineOne;
      address.part2 = typeof tmpData.address2 !== 'undefined' ? tmpData.address2 : paperDetails.addressLineTwo;
      address.part3 = typeof tmpData.address3 !== 'undefined' ? tmpData.address3 : paperDetails.addressLineThree;
      address.part4 = typeof tmpData.address4 !== 'undefined' ? tmpData.address4 : paperDetails.addressTown;
      address.part5 = typeof tmpData.address5 !== 'undefined' ? tmpData.address5 : paperDetails.addressCounty;
      address.postcode = typeof tmpData.postcode !== 'undefined' ? tmpData.postcode : paperDetails.addressPostcode;

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('summons-management/paper-reply/edit-address', {
        address: address,
        postUrl: app.namedRoutes.build('paper-reply.edit-address.post', {
          id: req.params.id,
        }),
        cancelUrl: app.namedRoutes.build('paper-reply.index.get', {
          id: req.params.id,
        }),
        errors: {
          title: 'Please check the form',
          count: countErrors(tmpErrors),
          items: tmpErrors,
        },
        saveBtnLabel: 'Review Edit',
      });
    };
  };

  module.exports.postEditAddress = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, paperReplyValidator.jurorAddress());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('paper-reply.edit-address.get', {
          id: req.params['id'],
        }));
      }

      req.session.paperResponseDetails.addressLineOne = req.body['address1'];
      req.session.paperResponseDetails.addressLineTwo = req.body['address2'];
      req.session.paperResponseDetails.addressLineThree = req.body['address3'];
      req.session.paperResponseDetails.addressTown = req.body['address4'];
      req.session.paperResponseDetails.addressCounty = req.body['address5'];
      req.session.paperResponseDetails.addressPostcode = req.body['postcode'];

      return res.redirect(app.namedRoutes.build('paper-reply.index.get', {
        id: req.params.id,
      }));
    };
  };

  function eligibilityDetails(eligibilityData) {
    const eligibility = {
      livedConsecutive: '',
      mentalHealthAct : '',
      mentalHealthCapacity : '',
      onBail : '',
      convicted : '',
    };

    if (typeof eligibilityData !== 'undefined') {
      // eslint-disable-next-line guard-for-in
      for (const element in eligibilityData) {
        if (typeof eligibilityData[element] === 'boolean') {
          eligibility[element] = eligibilityData[element] ? 'yes' : 'no';
        } else {
          if (element === 'mentalHealthActDetails') {
            eligibility[element] = eligibilityData['mentalHealthActDetails'].split(" [MENTAL HEALTH Q2] ")[0];
            if (eligibilityData['mentalHealthActDetails'].split(" [MENTAL HEALTH Q2] ")[1]) {
              eligibility['mentalHealthCapacityDetails'] = eligibilityData['mentalHealthActDetails'].split(" [MENTAL HEALTH Q2] ")[1];
            }
          } else {
            eligibility[element] = eligibilityData[element];
          }
        }
      }
    }

    return eligibility;
  }

  module.exports.getEligibilityDetails = eligibilityDetails;

  const createEligibilityObject = function(body) {
    const tempEligibility = {};

    if (body.livedConsecutive) {
        if (body.livedConsecutive === 'yes') {
          tempEligibility.livedConsecutive = true;
        } else {
          tempEligibility.livedConsecutive = false;
          tempEligibility.livedConsecutiveDetails = body.livedConsecutiveDetails;
        }
      }
      if (body.mentalHealthAct) {
        if (body.mentalHealthAct === 'yes') {
          tempEligibility.mentalHealthAct = true;
          tempEligibility.mentalHealthActDetails = body.mentalHealthActDetails;
        } else {
          tempEligibility.mentalHealthAct = false;
        }
      }
      if (body.mentalHealthCapacity) {
        if (body.mentalHealthCapacity === 'yes') {
          tempEligibility.mentalHealthCapacity = true;
          tempEligibility.mentalHealthCapacityDetails = body.mentalHealthCapacityDetails;
        } else {
          tempEligibility.mentalHealthCapacity = false;
        }
      }
      if (body.onBail) {
        if (body.onBail === 'yes') {
          tempEligibility.onBail = true;
          tempEligibility.onBailDetails = body.onBailDetails;
        } else {
          tempEligibility.onBail = false;
        }
      }
      if (body.convicted) {
        if (body.convicted === 'yes') {
          tempEligibility.convicted = true;
          tempEligibility.convictedDetails = body.convictedDetails;
        } else {
          tempEligibility.convicted = false;
        }
      }

      return tempEligibility;
  }

  module.exports.createEligibilityObject = createEligibilityObject;

  const mergeMentalHealthInfo = function(eligibilityPayload) {
    let tmpAct;
    let tmpCapacity;
    let tmpDetails;

    // Merge mentalHealthAct and mentalHealthCapacity details into mentalHealthAct

    if (typeof eligibilityPayload.mentalHealthAct != 'undefined'){
      tmpAct = eligibilityPayload.mentalHealthAct;
    }
    if (typeof eligibilityPayload.mentalHealthCapacity != 'undefined'){
      tmpCapacity = eligibilityPayload.mentalHealthCapacity;
    }

    tmpDetails = '';

    if (tmpAct && typeof eligibilityPayload.mentalHealthActDetails != 'undefined'){
      tmpDetails = eligibilityPayload.mentalHealthActDetails;
    }

    if (tmpCapacity && typeof eligibilityPayload.mentalHealthCapacityDetails != 'undefined'){
      if (typeof tmpDetails === 'undefined' || tmpDetails === '' || tmpDetails === null) {
        tmpDetails = eligibilityPayload.mentalHealthCapacityDetails;
      } else {
        tmpDetails = tmpDetails.concat(' [MENTAL HEALTH Q2] ');
        tmpDetails = tmpDetails.concat(eligibilityPayload.mentalHealthCapacityDetails);
      }
    }

    eligibilityPayload.mentalHealthActDetails = tmpDetails;

    delete eligibilityPayload.mentalHealthCapacityDetails;

  };

  module.exports.mergeMentalHealthInfo = mergeMentalHealthInfo;

})();
