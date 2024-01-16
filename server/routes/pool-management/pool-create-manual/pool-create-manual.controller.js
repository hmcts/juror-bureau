(function(){
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , modUtils = require('../../../lib/mod-utils')
    , validator = require('../../../config/validation/pool-create-court-only')
    , requestPoolObj = require('../../../objects/request-pool')
    , { generatePoolNumber } = require('../../../objects/request-pool')
    , { dateFilter } = require('../../../components/filters')
    , courtSelectValidator = require('../../../config/validation/request-pool').courtNameOrLocation;

  module.exports.index = function(app) {
    return async function(req, res) {
      const createJurorMode = req.originalUrl === app.namedRoutes.build('create-juror-record.create-pool.get');
      const tmpErrors = _.cloneDeep(req.session.errors);
      const multiCourt = req.session.courtsList.length > 1;
      const courtsList = _.clone(req.session.courtsList);
      let formFields, postUrl, cancelUrl, backLinkUrl, changeCourtUrl;

      if (req.session.formFields) {
        formFields = _.cloneDeep(req.session.formFields);
      } else if (req.session.poolCreateFormFields.poolDetails) {
        formFields = _.cloneDeep(req.session.poolCreateFormFields.poolDetails);
      };

      delete req.session.errors;
      delete req.session.formFields;

      if (req.session.courtChange) {
        req.body.courtNameOrLocation = req.session.courtChange;
      } else if (req.session.poolCreateFormFields.poolDetails) {
        req.body.courtNameOrLocation = req.session.poolCreateFormFields.poolDetails.courtLocCode;
      } else {
        req.body.courtNameOrLocation = req.session.authentication.staff.courts[0];
      }

      if (createJurorMode) {
        postUrl = app.namedRoutes.build('create-juror-record.create-pool.post');
        cancelUrl = app.namedRoutes.build('juror-management.manage-jurors.in-waiting.get');
        backLinkUrl = app.namedRoutes.build('create-juror-record.get');
        changeCourtUrl = app.namedRoutes.build('create-juror-record.create-pool.change-court.get');
      } else {
        postUrl = app.namedRoutes.build('court-only-pool.post');
        cancelUrl = app.namedRoutes.build('pool-management.get');
        backLinkUrl = app.namedRoutes.build('pool-create-select.get');
        changeCourtUrl = app.namedRoutes.build('court-only-pool.select-court.get');

      }

      try {
        const courtData = await modUtils.matchUserCourt(courtsList, req.body);

        return res.render('pool-management/pool-create-manual/index.njk', {
          postUrl,
          cancelUrl,
          backLinkUrl,
          changeCourtUrl,
          multiCourt,
          courtData,
          formFields,
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Unable to fetch court list', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postPoolDetails = function(app) {
    return function(req, res) {
      const createJurorMode = req.originalUrl === app.namedRoutes.build('create-juror-record.create-pool.post');
      const validatorResult = validate(req.body, validator());
      const tmpBody = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(createJurorMode
          ? app.namedRoutes.build('create-juror-record.create-pool.get')
          : app.namedRoutes.build('court-only-pool.get')
        );
      };

      req.session.poolCreateFormFields.poolDetails = {
        courtLocCode: tmpBody.courtLocCode,
        courtName: tmpBody.courtName,
        serviceStartDate: tmpBody.serviceStartDate,
        poolType: tmpBody.poolType,
      };

      delete req.session.formFields;
      delete req.session.courtChange;

      return res.redirect(createJurorMode
        ? app.namedRoutes.build('create-juror-record.create-pool.confirm.get')
        : app.namedRoutes.build('court-only-pool.check-details.get')
      );
    };
  };

  module.exports.getSelectCourt = function(app) {
    return function(req, res) {
      const createJurorMode = req.originalUrl === app.namedRoutes.build(
        'create-juror-record.create-pool.change-court.get'
      );
      const transformedCourtNames = modUtils.transformCourtNames(req.session.courtsList);
      const tmpErrors = _.cloneDeep(req.session.errors);
      let formFields, submitUrl, cancelUrl;

      if (req.session.formFields) {
        formFields = _.cloneDeep(req.session.formFields);
      };

      delete req.session.errors;
      delete req.session.formFields;

      if (createJurorMode) {
        submitUrl = app.namedRoutes.build('create-juror-record.create-pool.change-court.post');
        cancelUrl = app.namedRoutes.build('create-juror-record.create-pool.get');
      } else {
        submitUrl = app.namedRoutes.build('court-only-pool.select-court.post');
        cancelUrl = app.namedRoutes.build('court-only-pool.get');
      }

      return res.render('pool-management/_common/select-court', {
        courts: transformedCourtNames,
        pageTitle: 'Select a court',
        formFields: formFields,
        submitUrl,
        cancelUrl,
        pageIdentifier: 'Create a pool for court use only',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postSelectCourt = function(app) {
    return async function(req, res) {
      const createJurorMode = req.originalUrl === app.namedRoutes.build(
        'create-juror-record.create-pool.change-court.post'
      );
      const courtsList = _.clone(req.session.courtsList);
      const validatorResult = validate(req.body, courtSelectValidator(req));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(createJurorMode
          ? app.namedRoutes.build('create-juror-record.create-pool.change-court.get')
          : app.namedRoutes.build('court-only-pool.select-court.get')
        );
      }

      try {
        const courtData = await modUtils.matchUserCourt(courtsList, req.body);

        req.session.courtChange = courtData.locationCode;

        delete req.session.errors;
        delete req.session.formFields;

        return res.redirect(createJurorMode
          ? app.namedRoutes.build('create-juror-record.create-pool.get')
          : app.namedRoutes.build('court-only-pool.get')
        );

      } catch (err) {
        req.session.errors = {
          courtNameOrLocation: [{
            summary: 'Please check the court name or location',
            details: 'This court does not exist. Please enter a name or code of an existing court',
          }],
        };

        res.redirect(createJurorMode
          ? app.namedRoutes.build('create-juror-record.create-pool.change-court.get')
          : app.namedRoutes.build('court-only-pool.select-court.get')
        );
      }
    };
  };

  module.exports.getCheckPoolDetails = function(app) {
    return function(req, res) {
      const createJurorMode = req.originalUrl === app.namedRoutes.build(
        'create-juror-record.create-pool.confirm.get'
      );
      const poolDetails = _.cloneDeep(req.session.poolCreateFormFields.poolDetails);
      const multiCourt = req.session.courtsList.length > 1;
      let submitUrl, cancelUrl, changeUrl;

      if (createJurorMode) {
        submitUrl = app.namedRoutes.build('create-juror-record.create-pool.confirm.post');
        cancelUrl = app.namedRoutes.build('create-juror-record.get');
        changeUrl = app.namedRoutes.build('create-juror-record.create-pool.get');
      } else {
        submitUrl = app.namedRoutes.build('court-only-pool.check-details.post');
        cancelUrl = app.namedRoutes.build('pool-management.get');
        changeUrl = app.namedRoutes.build('court-only-pool.get');
      }

      return res.render('pool-management/pool-create-manual/check-details.njk', {
        poolDetails: poolDetails,
        multiCourt: multiCourt,
        submitUrl,
        cancelUrl,
        changeUrl,
      });
    };
  };

  module.exports.postCheckPoolDetails = function(app) {
    return async function(req, res) {
      const attendanceDate = dateFilter(
        req.session.poolCreateFormFields.poolDetails.serviceStartDate,
        'DD/MM/YYYY',
        'YYYY-MM-DD',
      );

      const poolNumber = await generatePoolNumber.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.session.poolCreateFormFields.poolDetails.courtLocCode,
        attendanceDate,
      );

      requestPoolObj.createPoolRequest.post(
        require('request-promise'),
        app, req.session.authToken,
        {
          attendanceDate,
          courtCode: req.session.poolCreateFormFields.poolDetails.courtLocCode,
          courtOnly: true,
          poolNumber,
          poolType: req.session.poolCreateFormFields.poolDetails.poolType,
        }
      ).then(() => {
        const newPoolCreated = {
          html: 'New pool <a href="'+ app.namedRoutes.build('pool-overview.get', {
            poolNumber: poolNumber,
          }) + '"'
          + '" class="govuk-link">' + poolNumber + '</a> created',
        };

        req.session.newPoolCreated = newPoolCreated;
        delete req.session.poolCreateFormFields;

        return res.redirect(app.namedRoutes.build('pool-management.get') + '?status=created&tab=court');
      }).catch(err => {
        app.logger.crit('Unable to manually create court-only pool', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      });
    };
  };
})();
