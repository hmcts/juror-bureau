(function(){
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const moment = require('moment');
  const validator = require('../../../config/validation/record-create-manual');
  const { jurorCreateObject, bureauCreateJuror } = require('../../../objects/juror-create-manual');
  const { reassignJurors } = require('../../../objects/pool-management');
  const courtSelectValidator = require('../../../config/validation/request-pool').courtNameOrLocation;
  const { poolSummaryObject } = require('../../../objects/pool-summary');
  const { fetchCourts } = require('../../../objects/request-pool');
  const { matchUserCourt, transformCourtNames, dateDifference, splitPostCode } = require('../../../lib/mod-utils');
  const { generatePoolNumber } = require('../../../objects/request-pool');
  const { buildRecordAddress } = require('../../../components/filters/index');
  const { dateFilter } = require('../../../components/filters');
  const { courtLocationsFromPostcodeObj } = require('../../../objects/court-location');
  const { canCreateBureauJuror } = require('../../../components/auth/user-type');
  const subServiceName = 'Create juror record';

  module.exports.hasStarted = function(app) {
    return function(req, res, next) {
      if (isBureauCreation(req, res)) {
        const { poolNumber } = req.params;
        if (typeof req.session.newJuror === 'undefined' || req.session.newJuror.poolNumber !== poolNumber) {
          return res.redirect(app.namedRoutes.build('bureau-create-juror-record.get', { poolNumber }));
        }
      }
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
          courtNameOrLocation: req.session.authentication.locCode,
        };
      };

      if (req.session.newJuror) {
        selectedPoolNumber = _.cloneDeep(req.session.newJuror.poolNumber);
      }

      delete req.session.errors;

      try {
        const courtsList = await fetchCourts.get(req);
        const courtData = await matchUserCourt(courtsList.courts, locCode);
        const poolsList = await reassignJurors.availableCourtOwnedPools
          .get(req, courtData.locationCode);
        const multiCourt = courtsList.courts.length > 1;

        req.session.courtsList = courtsList.courts;
        if (!req.session.poolCreateFormFields) {
          req.session.poolCreateFormFields = {};
        }

        return res.render('juror-management/create-record-manual/index', {
          pools: poolsList.availablePools,
          postUrl: app.namedRoutes.build('create-juror-record.pool-select.post'),
          cancelUrl: cancelUrl(req, res, app),
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

        return res.render('_errors/generic', { err });
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

      return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-name.get', req, res), {
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

      return res.redirect(app.namedRoutes.build(summaryStageCheck('create-juror-record.juror-name.get', req, res), {
        poolNumber: 'new-pool',
      }));
    };
  };

  module.exports.getChangeCourt = function(app) {
    return function(req, res) {
      const transformedCourtNames = transformCourtNames(req.session.courtsList);
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
        const courtData = await matchUserCourt(courtsList, req.body);

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
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
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
        postUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-name.post`, {
          poolNumber,
        }),
        cancelUrl: cancelUrl(req, res, app),
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
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const validatorResult = validate(req.body, validator.jurorName());
      let tmpBody = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-name.get`, {
          poolNumber,
        }));
      };

      delete tmpBody._csrf;

      req.session.newJuror.jurorName = tmpBody;

      return res.redirect(app.namedRoutes.build(summaryStageCheck(`${routePrefix}create-juror-record.juror-dob.post`, req, res), {
        poolNumber,
      }));
    };
  };

  module.exports.getJurorDob = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const tmpErrors = _.cloneDeep(req.session.errors);
      let formFields;

      if (typeof req.session.newJuror.jurorName === 'undefined') {
        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-name.get`, {
          poolNumber,
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
        postUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-dob.post`, {
          poolNumber,
        }),
        cancelUrl: cancelUrl(req, res, app),
        backLinkUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-name.get`, {
          poolNumber,
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
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const validatorResult = validate(req.body, validator.jurorDob(isBureauCreation(req, res)));
      let tmpBody = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body.jurorDob;

        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-dob.get`, {
          poolNumber,
        }));
      };

      try {
        let courtStartDate;

        if (poolNumber === 'new-pool') {
          courtStartDate = req.session.poolCreateFormFields.poolDetails.serviceStartDate;
        } else {
          const poolData = await poolSummaryObject.get(req, poolNumber);

          courtStartDate = dateFilter(new Date(poolData.poolDetails.courtStartDate), null, 'DD/MM/YYYY');
        }

        if (tmpBody.jurorDob) {
          const ageAtStartDate = dateDifference(courtStartDate, req.body.jurorDob, 'years');

          req.session.newJuror.jurorDob = tmpBody.jurorDob || null;
          req.session.newJuror.ageAtStartDate = ageAtStartDate;

          if (ageAtStartDate < 18 || ageAtStartDate > 75) {
            return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.ineligible-age.get`, {
              poolNumber,
            }));
          };
        }

        return res.redirect(app.namedRoutes.build(summaryStageCheck(`${routePrefix}create-juror-record.juror-address.get`, req, res), {
          poolNumber,
        }));

      } catch (err) {
        app.logger.crit('Unable to fetch pool start date', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      };
    };
  };

  module.exports.getIneligibleAge = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
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
        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-dob.get`, {
          poolNumber,
        }));
      };

      delete req.session.errors;

      return res.render('juror-management/create-record-manual/ineligible-age.njk', {
        postUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.ineligible-age.post`, {
          poolNumber,
        }),
        cancelUrl: cancelUrl(req, res, app),
        subServiceName: subServiceName,
        pageIdentifier: 'Check the date of birth',
        formTitle: 'Is their date of birth correct?',
        formOptions: formOptions,
        dob: dateFilter(req.session.newJuror.jurorDob, 'DD/MM/YYYY', 'DD MMMM YYYY'),
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
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const validatorResult = validate(req.body, validator.confirmIneligibleAge());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.ineligible-age.get`, {
          poolNumber,
        }));
      };

      if (req.body.confirmIneligibleAge === 'change') {
        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-dob.get`, {
          poolNumber,
        }));
      };

      return res.redirect(cancelUrl(req, res, app));
    };
  };

  module.exports.getJurorAddress = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const tmpErrors = _.cloneDeep(req.session.errors);
      let formFields;

      if (typeof req.session.newJuror.jurorDob === 'undefined' && !isBureauCreation(req, res)) {
        return res.redirect(app.namedRoutes.build('create-juror-record.juror-dob.get', {
          poolNumber,
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
        postUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.post`, {
          poolNumber,
        }),
        cancelUrl: cancelUrl(req, res, app),
        backLinkUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-dob.get`, {
          poolNumber,
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
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const validatorResult = validate(req.body, validator.jurorAddress());
      let tmpBody = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.get`, {
          poolNumber,
        }));
      };

      try {
        const locCode = poolNumber === 'new-pool' ?
          req.session.newJuror.createPool.courtLocCode : poolNumber.slice(0, 3);

        delete tmpBody._csrf;

        tmpBody.addressPostcode = tmpBody.addressPostcode.toUpperCase();

        req.session.newJuror.jurorAddress = tmpBody;

        const postcode = splitPostCode(tmpBody.addressPostcode);
        const catchmentAreas = await courtLocationsFromPostcodeObj.get(req, postcode);

        req.session.newJuror.catchmentAreas = catchmentAreas;

        if (!catchmentAreas.some(loc => loc.locationCode === locCode)) {
          return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.outside-postcode.get`, {
            poolNumber,
          }));
        };

        return res.redirect(app.namedRoutes.build(summaryStageCheck(`${routePrefix}create-juror-record.juror-contact.get`, req, res), {
          poolNumber,
        }));

      } catch (err) {
        if (err.statusCode === 404) {
          req.session.newJuror.catchmentAreas = [];
          return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.outside-postcode.get`, {
            poolNumber,
          }));
        }
        app.logger.crit('Unable to check postcode', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          data: { postcode: tmpBody.addressPostcode },
        });
        return res.render('_errors/generic', { err });

      };
    };
  };

  module.exports.getOutsidePostcode = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';

      return res.render('juror-management/create-record-manual/outside-postcode.njk', {
        continueUrl: app.namedRoutes.build(summaryStageCheck(`${routePrefix}create-juror-record.juror-contact.get`, req, res), {
          poolNumber,
        }),
        changeUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.get`, {
          poolNumber,
        }),
        subServiceName: subServiceName,
        catchmentAreas: req.session.newJuror.catchmentAreas.length,
        pageIdentifier: 'Outside catchment area',
      });
    };
  };

  module.exports.getContact = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      let formFields

      if (typeof req.session.newJuror.jurorAddress === 'undefined') {
        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.get`, {
          poolNumber,
        }));
      };

      if (req.session.newJuror.jurorContact) {
        formFields = _.cloneDeep(req.session.newJuror.jurorContact);
      };

      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('juror-management/create-record-manual/juror-contact.njk', {
        postUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-contact.post`, {
          poolNumber,
        }),
        cancelUrl: cancelUrl(req, res, app),
        backLinkUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.get`, {
          poolNumber,
        }),
        subServiceName: subServiceName,
        pageIdentifier: 'Enter their contact details',
        formFields,
        tmpFields,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postContact = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const validatorResult = validate(req.body, validator.contactDetails(req.body));

      if (validatorResult) {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-contact.get`, {
          poolNumber,
        }));
      }

      let tmpBody = req.body;

      delete tmpBody._csrf;
      delete req.session.errors;
      delete req.session.formFields;

      req.session.newJuror.jurorContact = tmpBody;

      return res.redirect(app.namedRoutes.build(summaryStageCheck(`${routePrefix}create-juror-record.notes.get`, req, res), {
        poolNumber,
      }));
    };
  };

  module.exports.getNotes = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpFields = _.cloneDeep(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;
      
      let formFields;
      
      if (typeof req.session.newJuror.jurorAddress === 'undefined') {
        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.get`, {
          poolNumber,
        }));
      };

      if (req.session.newJuror.notes) {
        formFields = {
          notes: _.cloneDeep(req.session.newJuror.notes),
        };
      };

      return res.render('juror-management/create-record-manual/notes.njk', {
        postUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.notes.post`, {
          poolNumber,
        }),
        cancelUrl: cancelUrl(req, res, app),
        subServiceName: subServiceName,
        pageIdentifier: 'Notes',
        formFields: formFields,
        poolNumber,
        tmpFields,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postNotes = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      const validatorResult = validate(req.body, validator.jurorNotes(req.body));

      if (validatorResult) {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.notes.get`, {
          poolNumber,
        }));
      }

      let tmpBody = req.body;

      delete tmpBody._csrf;

      req.session.newJuror.notes = tmpBody.notes;

      return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.summary.get`, {
        poolNumber,
      }));
    };
  };

  module.exports.getSummary = function(app) {
    return async function(req, res) {
      const { poolNumber } = req.params;
      const routePrefix = isBureauCreation(req, res) ? 'bureau-' : '';
      if (typeof req.session.newJuror.jurorAddress === 'undefined') {
        return res.redirect(app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.get`, {
          poolNumber,
        }));
      };

      req.session.newJuror.summaryStage = true;

      let newPoolNumber;

      if (poolNumber === 'new-pool') {
        newPoolNumber = await generatePoolNumber.get(
          req,
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
        jurorDob: req.session.newJuror.jurorDob ? constructDob(req.session.newJuror.jurorDob, req.session.newJuror.ageAtStartDate) : null,
        jurorName: constructName(req.session.newJuror.jurorName),
        jurorAddress: buildRecordAddress(addressParts),
        poolNumber: newPoolNumber || poolNumber,
      };

      const changeUrls = {
        poolNumber: app.namedRoutes.build('create-juror-record.get'),
        jurorName: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-name.get`, {
          poolNumber,
        }),
        jurorDob: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-dob.get`, {
          poolNumber,
        }),
        jurorAddress: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-address.get`, {
          poolNumber,
        }),
        jurorContact: app.namedRoutes.build(`${routePrefix}create-juror-record.juror-contact.get`, {
          poolNumber,
        }),
        notes: app.namedRoutes.build(`${routePrefix}create-juror-record.notes.get`, {
          poolNumber,
        }),
      };

      const jurorDetails = newPoolNumber ? { ...req.session.newJuror, newPoolNumber } : req.session.newJuror;

      const cancelUrl = isBureauCreation(req, res)
        ? app.namedRoutes.build('pool-overview.get', {
          poolNumber,
        })
        : app.namedRoutes.build('juror-management.manage-jurors.pools.get');

      return res.render('juror-management/create-record-manual/summary.njk', {
        postUrl: app.namedRoutes.build(`${routePrefix}create-juror-record.summary.post`, {
          poolNumber,
        }),
        cancelUrl,
        pageIdentifier: 'Check your answers',
        subServiceName,
        formFields,
        jurorDetails,
        changeUrls: changeUrls,
        isBureauCreation: isBureauCreation(req, res),
      });
    };
  };

  module.exports.postSummary = function(app) {
    return async function(req, res) {
      const { poolNumber } = req.params;
      try {
        if (isBureauCreation(req, res)) {
          await bureauCreateJuror.post(req, buildCreationPayload(req.session.newJuror));
        } else {
          await jurorCreateObject.post(req, buildCreationPayload(req.session.newJuror))
        }

        const jurorName = {
          firstName: req.session.newJuror.jurorName.firstName,
          lastName:  req.session.newJuror.jurorName.lastName,
        };
        const constructedName = constructName(jurorName);
        const bannerMessage = isBureauCreation(req, res)
          ? `Juror record created for ${constructedName} and summoned to pool ${req.session.newJuror.poolNumber}`
          : `Draft juror record created for ${constructedName} - senior jury officer will need to approve this`;

        req.session.bannerMessage = bannerMessage;
        delete req.session.newJuror;

        const redirectUrl = isBureauCreation(req, res)
          ? app.namedRoutes.build('pool-overview.get', {
            poolNumber,
          })
          : app.namedRoutes.build('juror-management.manage-jurors.pending-approval.get');

        return res.redirect(redirectUrl);

      } catch (err) {
        app.logger.crit(`Unable to manually create a juror at the ${isBureauCreation(req, res) ? 'bureau' : 'court'}`, {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          data: buildCreationPayload(req.session.newJuror),
        });

        return res.render('_errors/generic', { err });
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

  function summaryStageCheck(postPath, req, res) {
    if (typeof req.session.newJuror !== 'undefined' && typeof req.session.newJuror.summaryStage !== 'undefined') {
      return isBureauCreation(req, res)
        ? 'bureau-create-juror-record.summary.get'
        : 'create-juror-record.summary.get';
    }
    return postPath;
  };

  function cancelUrl(req, res, app) {
    const { poolNumber } = req.params;
    if (typeof req.session.newJuror !== 'undefined' && typeof req.session.newJuror.summaryStage !== 'undefined') {
      return isBureauCreation(req, res)
        ? app.namedRoutes.build('bureau-create-juror-record.summary.get', {
          poolNumber: req.session.newJuror.poolNumber,
        })
        : app.namedRoutes.build('create-juror-record.summary.get', {
          poolNumber: req.session.newJuror.poolNumber,
        });
    }
    return isBureauCreation(req, res)
      ? app.namedRoutes.build('pool-overview.get', {
        poolNumber,
      })
      : app.namedRoutes.build('juror-management.manage-jurors.pools.get');
  }

  function isBureauCreation(req, res) {
    return req.url.includes('pool-management') && canCreateBureauJuror(req, res);
  }

  function buildCreationPayload(jurorDetails) {
    const payload = {
      'title': jurorDetails.jurorName.title,
      'first_name': jurorDetails.jurorName.firstName,
      'last_name': jurorDetails.jurorName.lastName,
      'address': {
        'line_one': jurorDetails.jurorAddress.addressLineOne,
        'line_two': jurorDetails.jurorAddress.addressLineTwo,
        'line_three': jurorDetails.jurorAddress.addressLineThree,
        'town': jurorDetails.jurorAddress.addressTown,
        'county': jurorDetails.jurorAddress.addressCounty,
        'postcode': jurorDetails.jurorAddress.addressPostcode,
      },
      ...(jurorDetails.jurorDob && {'date_of_birth': dateFilter(jurorDetails.jurorDob, 'DD/MM/YYYY', 'YYYY-MM-DD')}),
      ...(jurorDetails.jurorContact.mainPhone && {'primary_phone': jurorDetails.jurorContact.mainPhone}),
      ...(jurorDetails.jurorContact.alternativePhone && {'alternative_phone': jurorDetails.jurorContact.alternativePhone}),
      ...(jurorDetails.jurorContact.emailAddress && {'email_address': jurorDetails.jurorContact.emailAddress}),
      'notes': jurorDetails.notes,
      'pool_number': jurorDetails.poolNumber,
      'court_code' : jurorDetails.courtLocCode,
    }
    if (jurorDetails.hasOwnProperty('createPool')) {
      payload['service_start_date'] = dateFilter(jurorDetails.createPool.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD');
      payload['pool_type'] = jurorDetails.createPool.poolType;
      payload['court_code'] = jurorDetails.createPool.courtLocCode;
      delete payload['pool_number'];
    }
    return payload;
  }

})();
