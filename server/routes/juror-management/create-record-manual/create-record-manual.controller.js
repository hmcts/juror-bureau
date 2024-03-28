(function(){
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , moment = require('moment')
    , validator = require('../../../config/validation/record-create-manual')
    , jurorCreateObject = require('../../../objects/juror-create-manual').jurorCreateObject
    , requestObj = require('../../../objects/pool-management').reassignJurors
    , courtSelectValidator = require('../../../config/validation/request-pool').courtNameOrLocation
    , poolSummary = require('../../../objects/pool-summary').poolSummaryObject
    , fetchCourts = require('../../../objects/request-pool').fetchCourts
    , modUtils = require('../../../lib/mod-utils')
    , { generatePoolNumber } = require('../../../objects/request-pool')
    , addressBuilder = require('../../../components/filters/index').buildRecordAddress
    , dateFilter = require('../../../components/filters').dateFilter
    , subServiceName = 'Create juror record'
    , { courtLocationsFromPostcodeObj } = require('../../../objects/court-location');

  module.exports.hasStarted = function(app) {
    return function(req, res, next) {
      if (typeof req.session.newJuror === 'undefined') {
        return res.redirect(app.namedRoutes.build('create-juror-record.get'));
      };

      next();
    };
  };

  module.exports.index = function(app) {
    return async function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      let selectedPoolNumber;
      let locCode;

      if (req.session.courtChange) {
        locCode = {
          courtNameOrLocation: req.session.courtChange,
        };
      } else {
        locCode = {
          courtNameOrLocation: req.session.authentication.staff.courts[0],
        };
      };

      if (req.session.newJuror) {
        selectedPoolNumber = _.cloneDeep(req.session.newJuror.poolNumber);
      }

      delete req.session.errors;

      try {
        const courtsList = await fetchCourts.get(require('request-promise'), app, req.session.authToken);
        const courtData = await modUtils.matchUserCourt(courtsList.courts, locCode);
        const poolsList = await requestObj.availableCourtOwnedPools
          .get(require('request-promise'), app, req.session.authToken, courtData.locationCode);
        const multiCourt = courtsList.courts.length > 1;

        req.session.courtsList = courtsList.courts;
        if (!req.session.poolCreateFormFields) {
          req.session.poolCreateFormFields = {};
        }

        return res.render('juror-management/create-record-manual/index', {
          pools: poolsList.availablePools,
          postUrl: app.namedRoutes.build('create-juror-record.pool-select.post'),
          cancelUrl: cancelUrl(req, app),
          changeCourtUrl: app.namedRoutes.build('create-juror-record.change-court.get'),
          court: courtData,
          multiCourt: multiCourt,
          selectedPoolNumber: selectedPoolNumber,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });

      } catch (err) {
        app.logger.crit('Unable to fetch pool list', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  module.exports.postPoolSelect = function(app) {
    return function(req, res) {
      const validatorResult = validate(req.body, validator.poolSelect());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('create-juror-record.get'));
      };

      if (req.body.poolNumber === 'new-pool') {
        return res.redirect(app.namedRoutes.build('create-juror-record.create-pool.get'));
      }

      if (req.session.newJuror) {
        req.session.newJuror.poolNumber = req.body.poolNumber;
        req.session.newJuror.courtLocCode = req.body.poolNumber.slice(0, 3);
      } else {
        req.session.newJuror = {
          poolNumber: req.body.poolNumber,
          courtLocCode: req.body.poolNumber.slice(0, 3),
        };
      };

      return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-name.get', req), {
        poolNumber: req.body.poolNumber,
      }));
    };
  };

  module.exports.postConfirmPool = function(app) {
    return function(req, res) {
      let postBody = _.cloneDeep(req.body);

      req.session.newJuror = {
        ...req.session.newJuror,
        createPool: postBody,
        poolNumber: 'new-pool',
      };

      return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-name.get', req), {
        poolNumber: 'new-pool',
      }));
    };
  };

  module.exports.getChangeCourt = function(app) {
    return function(req, res) {
      const transformedCourtNames = modUtils.transformCourtNames(req.session.courtsList);
      const tmpErrors = _.cloneDeep(req.session.errors);
      let formFields;

      if (req.session.formFields) {
        formFields = _.cloneDeep(req.session.formFields);
      };

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('pool-management/_common/select-court', {
        courts: transformedCourtNames,
        pageTitle: 'Select a court',
        formFields: formFields,
        submitUrl: app.namedRoutes.build('create-juror-record.change-court.post'),
        cancelUrl: app.namedRoutes.build('create-juror-record.get'),
        pageIdentifier: 'Change court location',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postChangeCourt = function(app) {
    return async function(req, res) {
      const courtsList = _.clone(req.session.courtsList);
      const validatorResult = validate(req.body, courtSelectValidator(req));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('create-juror-record.change-court.get'));
      }

      try {
        const courtData = await modUtils.matchUserCourt(courtsList, req.body);

        req.session.courtChange = courtData.locationCode;

        delete req.session.errors;
        delete req.session.formFields;

        return res.redirect(app.namedRoutes.build('create-juror-record.get'));

      } catch (err) {
        req.session.errors = {
          courtNameOrLocation: [{
            summary: 'Please check the court name or location',
            details: 'This court does not exist. Please enter a name or code of an existing court',
          }],
        };

        res.redirect(app.namedRoutes.build('create-juror-record.change-court.get'));
      }
    };
  };

  module.exports.getJurorName = function(app) {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      let formFields;

      if (req.session.formFields) {
        formFields = _.cloneDeep(req.session.formFields);
      } else if (req.session.newJuror) {
        formFields = _.cloneDeep(req.session.newJuror.jurorName);
      }

      delete req.session.formFields;
      delete req.session.errors;

      return res.render('juror-management/create-record-manual/juror-name.njk', {
        postUrl: app.namedRoutes.build('create-juror-record.juror-name.post', {
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: cancelUrl(req, app),
        subServiceName: subServiceName,
        pageIdentifier: 'What\'s the juror\'s name?',
        formFields: formFields,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postJurorName = function(app) {
    return function(req, res) {
      const validatorResult = validate(req.body, validator.jurorName());
      let tmpBody = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('create-juror-record.juror-name.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      delete tmpBody._csrf;

      req.session.newJuror.jurorName = tmpBody;

      return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-dob.get', req), {
        poolNumber: req.params.poolNumber,
      }));
    };
  };

  module.exports.getJurorDob = function(app) {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      let formFields;

      if (typeof req.session.newJuror.jurorName === 'undefined') {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-name.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      if (req.session.formFields) {
        formFields = _.cloneDeep(req.session.formFields);
      } else if (req.session.newJuror.jurorDob) {
        formFields = _.cloneDeep(req.session.newJuror.jurorDob);
      };

      const today = new Date();
      const maxDobValue = `${ today.getDate() }/${ today.getMonth() + 1 }/${ today.getFullYear() }`;

      delete req.session.formFields;
      delete req.session.errors;

      return res.render('juror-management/create-record-manual/juror-dob.njk', {
        postUrl: app.namedRoutes.build('create-juror-record.juror-dob.post', {
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: cancelUrl(req, app),
        backLinkUrl: app.namedRoutes.build('create-juror-record.juror-name.get', {
          poolNumber: req.params.poolNumber,
        }),
        subServiceName: subServiceName,
        pageIdentifier: 'What\'s their date of birth?',
        jurorDob: formFields,
        maxDobValue: maxDobValue,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postJurorDob = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, validator.jurorDob());
      let tmpBody = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body.jurorDob;

        return res.redirect(app.namedRoutes.build('create-juror-record.juror-dob.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      try {
        let courtStartDate;

        if (req.params.poolNumber === 'new-pool') {
          courtStartDate = req.session.poolCreateFormFields.poolDetails.serviceStartDate;
        } else {
          const poolData = await poolSummary
            .get(require('request-promise'), app, req.session.authToken, req.params.poolNumber);

          courtStartDate = dateFilter(new Date(poolData.poolDetails.courtStartDate), null, 'DD/MM/YYYY');
        }

        const ageAtStartDate = modUtils.dateDifference(courtStartDate, req.body.jurorDob, 'years');

        req.session.newJuror.jurorDob = tmpBody.jurorDob;
        req.session.newJuror.ageAtStartDate = ageAtStartDate;

        if (ageAtStartDate < 18 || ageAtStartDate > 75) {
          return res.redirect(app.namedRoutes.build('create-juror-record.ineligible-age.get', {
            poolNumber: req.params.poolNumber,
          }));
        };

        return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-address.get', req), {
          poolNumber: req.params.poolNumber,
        }));

      } catch (err) {
        app.logger.crit('Unable to fetch pool start date', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  module.exports.getIneligibleAge = function(app) {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const formOptions = [
        {
          value: 'ineligible',
          text: 'Yes - you will not be able to continue creating a record for this juror',
        },
        {
          value: 'change',
          text: 'No - change date of birth',
        },
      ];

      if (typeof req.session.newJuror.jurorDob === 'undefined') {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-dob.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      delete req.session.errors;

      return res.render('juror-management/create-record-manual/ineligible-age.njk', {
        postUrl: app.namedRoutes.build('create-juror-record.ineligible-age.post', {
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: cancelUrl(req, app),
        subServiceName: subServiceName,
        pageIdentifier: 'Check the date of birth',
        formTitle: 'Is their date of birth correct?',
        formOptions: formOptions,
        dob: dateFilter(new Date(req.session.newJuror.jurorDob), null, 'DD MMMM YYYY'),
        yearsOld: req.session.newJuror.ageAtStartDate,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postIneligibleAge = function(app) {
    return function(req, res) {
      const validatorResult = validate(req.body, validator.confirmIneligibleAge());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('create-juror-record.ineligible-age.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      if (req.body.confirmIneligibleAge === 'change') {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-dob.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      return res.redirect(app.namedRoutes.build('juror-management.manage-jurors.pools.get'));
    };
  };

  module.exports.getJurorAddress = function(app) {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      let formFields;

      if (typeof req.session.newJuror.jurorDob === 'undefined') {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-dob.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      if (req.session.formFields) {
        formFields = _.cloneDeep(req.session.formFields);
      } else if (req.session.newJuror.jurorAddress) {
        formFields = _.cloneDeep(req.session.newJuror.jurorAddress);
      };

      delete req.session.formFields;
      delete req.session.errors;

      return res.render('juror-management/create-record-manual/juror-address.njk', {
        postUrl: app.namedRoutes.build('create-juror-record.juror-address.post', {
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: cancelUrl(req, app),
        backLinkUrl: app.namedRoutes.build('create-juror-record.juror-dob.get', {
          poolNumber: req.params.poolNumber,
        }),
        subServiceName: subServiceName,
        pageIdentifier: 'What\'s the juror\'s address?',
        formFields: formFields,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postJurorAddress = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, validator.jurorAddress());
      let tmpBody = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('create-juror-record.juror-address.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      try {
        const locCode = req.params.poolNumber === 'new-pool' ?
          req.session.newJuror.createPool.courtLocCode : req.params.poolNumber.slice(0, 3);

        delete tmpBody._csrf;

        req.session.newJuror.jurorAddress = tmpBody;

        const postcode = modUtils.splitPostCode(tmpBody.addressPostcode);
        const catchmentAreas = await courtLocationsFromPostcodeObj
          .get(require('request-promise'), app, req.session.authToken, postcode);

        req.session.newJuror.catchmentAreas = catchmentAreas;

        if (!catchmentAreas.some(loc => loc.locationCode === locCode)) {
          return res.redirect(app.namedRoutes.build('create-juror-record.outside-postcode.get', {
            poolNumber: req.params.poolNumber,
          }));
        };

        return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-contact.get', req), {
          poolNumber: req.params.poolNumber,
        }));

      } catch (err) {
        if (err.statusCode === 404) {
          req.session.newJuror.catchmentAreas = [];
          return res.redirect(app.namedRoutes.build('create-juror-record.outside-postcode.get', {
            poolNumber: req.params.poolNumber,
          }));
        }
        app.logger.crit('Unable to check postcode', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          data: { postcode: tmpBody.addressPostcode},
        });
        return res.render('_errors/generic.njk');

      };
    };
  };

  module.exports.getOutsidePostcode = function(app) {
    return function(req, res) {

      return res.render('juror-management/create-record-manual/outside-postcode.njk', {
        continueUrl: app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-contact.get', req), {
          poolNumber: req.params.poolNumber,
        }),
        changeUrl: app.namedRoutes.build('create-juror-record.juror-address.get', {
          poolNumber: req.params.poolNumber,
        }),
        subServiceName: subServiceName,
        catchmentAreas: req.session.newJuror.catchmentAreas.length,
        pageIdentifier: 'Outside catchment area',
      });
    };
  };

  module.exports.getContact = function(app) {
    return function(req, res) {
      let formFields;

      if (typeof req.session.newJuror.jurorAddress === 'undefined') {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-address.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      if (req.session.newJuror.jurorContact) {
        formFields = _.cloneDeep(req.session.newJuror.jurorContact);
      };

      return res.render('juror-management/create-record-manual/juror-contact.njk', {
        postUrl: app.namedRoutes.build('create-juror-record.juror-contact.post', {
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: cancelUrl(req, app),
        backLinkUrl: app.namedRoutes.build('create-juror-record.juror-address.get', {
          poolNumber: req.params.poolNumber,
        }),
        subServiceName: subServiceName,
        pageIdentifier: 'Enter their contact details',
        formFields: formFields,
      });
    };
  };

  module.exports.postContact = function(app) {
    return function(req, res) {
      let tmpBody = req.body;

      delete tmpBody._csrf;

      req.session.newJuror.jurorContact = tmpBody;

      return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.notes.get', req), {
        poolNumber: req.params.poolNumber,
      }));
    };
  };

  module.exports.getNotes = function(app) {
    return function(req, res) {
      let formFields;

      if (typeof req.session.newJuror.jurorAddress === 'undefined') {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-address.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      if (req.session.newJuror.notes) {
        formFields = {
          notes: _.cloneDeep(req.session.newJuror.notes),
        };
      };

      return res.render('juror-management/create-record-manual/notes.njk', {
        postUrl: app.namedRoutes.build('create-juror-record.notes.post', {
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: cancelUrl(req, app),
        subServiceName: subServiceName,
        pageIdentifier: 'Notes',
        formFields: formFields,
      });
    };
  };

  module.exports.postNotes = function(app) {
    return function(req, res) {

      let tmpBody = req.body;

      delete tmpBody._csrf;

      req.session.newJuror.notes = tmpBody.notes;

      return res.redirect(app.namedRoutes.build('create-juror-record.summary.get', {
        poolNumber: req.params.poolNumber,
      }));
    };
  };

  module.exports.getSummary = function(app) {
    return async function(req, res) {

      if (typeof req.session.newJuror.jurorAddress === 'undefined') {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-address.get', {
          poolNumber: req.params.poolNumber,
        }));
      };

      req.session.newJuror.summaryStage = true;

      let poolNumber;

      if (req.params.poolNumber === 'new-pool') {
        poolNumber = await generatePoolNumber.get(
          require('request-promise'),
          app,
          req.session.authToken,
          req.session.poolCreateFormFields.poolDetails.courtLocCode,
          dateFilter(req.session.poolCreateFormFields.poolDetails.serviceStartDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
        );
      }

      const addressParts = [
        req.session.newJuror.jurorAddress.addressLineOne,
        req.session.newJuror.jurorAddress.addressLineTwo,
        req.session.newJuror.jurorAddress.addressLineThree,
        req.session.newJuror.jurorAddress.addressTown,
        req.session.newJuror.jurorAddress.addressCounty,
        req.session.newJuror.jurorAddress.addressPostcode,
      ];
      const formFields = {
        jurorDob: constructDob(req.session.newJuror.jurorDob, req.session.newJuror.ageAtStartDate),
        jurorName: constructName(req.session.newJuror.jurorName),
        jurorAddress: addressBuilder(addressParts),
        poolNumber: poolNumber || req.params.poolNumber,
      };
      const changeUrls = {
        poolNumber: app.namedRoutes.build('create-juror-record.get'),
        jurorName: app.namedRoutes.build('create-juror-record.juror-name.get', {
          poolNumber: req.params.poolNumber,
        }),
        jurorDob: app.namedRoutes.build('create-juror-record.juror-dob.get', {
          poolNumber: req.params.poolNumber,
        }),
        jurorAddress: app.namedRoutes.build('create-juror-record.juror-address.get', {
          poolNumber: req.params.poolNumber,
        }),
        jurorContact: app.namedRoutes.build('create-juror-record.juror-contact.get', {
          poolNumber: req.params.poolNumber,
        }),
        notes: app.namedRoutes.build('create-juror-record.notes.get', {
          poolNumber: req.params.poolNumber,
        }),
      };

      const jurorDetails = poolNumber ? { ...req.session.newJuror, poolNumber} : req.session.newJuror;

      return res.render('juror-management/create-record-manual/summary.njk', {
        postUrl: app.namedRoutes.build('create-juror-record.summary.post', {
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: app.namedRoutes.build('juror-management.manage-jurors.pools.get'),
        pageIdentifier: 'Check your answers',
        subServiceName,
        formFields,
        jurorDetails,
        changeUrls: changeUrls,
      });
    };
  };

  module.exports.postSummary = function(app) {
    return async function(req, res) {
      try {
        await jurorCreateObject.post(require('request-promise'), app, req.session.authToken, req.session.newJuror);

        const jurorName = {
          firstName: req.session.newJuror.jurorName.firstName,
          lastName:  req.session.newJuror.jurorName.lastName,
        };
        const constructedName = constructName(jurorName);
        const bannerMessage =
          'Draft juror record created for ' + constructedName +' - senior jury officer will need to approve this';

        req.session.bannerMessage = bannerMessage;
        delete req.session.newJuror;

        return res.redirect(app.namedRoutes.build('juror-management.manage-jurors.pending-approval.get'));

      } catch (err) {
        app.logger.crit('Unable to manually create a juror', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  function constructName(name) {
    let jurorNameParts = [];

    if (name.title) {
      jurorNameParts.push(name.title);
    };
    jurorNameParts.push(name.firstName, name.lastName);

    return jurorNameParts.join(' ');
  };

  function constructDob(jurorDob, JurorAge) {
    const convertedDob = moment(jurorDob, 'DD/MM/YYYY').format('DD MMMM YYYY');
    const jurorAgeString = '(Juror will be ' + JurorAge + ' years old)';

    return [convertedDob, jurorAgeString].join(' ');
  };

  function summaryStageCheck(postPath, req) {
    if (typeof req.session.newJuror !== 'undefined' && typeof req.session.newJuror.summaryStage !== 'undefined') {
      return 'create-juror-record.summary.get';
    }
    return postPath;
  };

  function cancelUrl(req, app) {
    return typeof req.session.newJuror !== 'undefined' && typeof req.session.newJuror.summaryStage !== 'undefined'
      ? app.namedRoutes.build('create-juror-record.summary.get', {
        poolNumber: req.session.newJuror.poolNumber,
      })
      : app.namedRoutes.build('juror-management.manage-jurors.pools.get');
  }

})();
