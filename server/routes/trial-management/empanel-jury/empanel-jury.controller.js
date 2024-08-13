(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const validator = require('../../../config/validation/empanel-jury');
  const { empanelJurorsDAO, requestPanelDAO } = require('../../../objects/panel');
  const { trialDetailsObject } = require('../../../objects/create-trial');
  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.getEmpanelAmount = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      trialDetailsObject.get(
        require('request-promise'),
        app,
        req.session.authToken,
        trialNumber,
        locationCode
      ).then(trialData => {
        req.session[`${trialNumber}-${locationCode}-trial`] = trialData;

        const tmpErrors = _.clone(req.session.errors);
        let tmpBody = _.clone(req.session.formFields);

        delete req.session.errors;
        delete req.session.formFields;

        return res.render('trial-management/empanel-jury/index.njk', {
          submitUrl: app.namedRoutes.build('trial-management.empanel.post',  {
            trialNumber,
            locationCode,
          }),
          cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
            trialNumber,
            locationCode,
          }),
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          tmpBody: tmpBody,
        });
      }, err => {
        app.logger.crit('Failed to post empanel amount', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      });
    };
  };

  module.exports.postEmpanelAmount = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      requestPanelDAO.get(
        app,
        req,
        trialNumber,
        locationCode,
        req.body.numberOfJurors
      ).then(resp => {
        const noOfJurors = resp.length;
        const validatorResult = validate(req.body, validator.numberOfJurors(noOfJurors));

        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('trial-management.empanel.get', {
            trialNumber,
            locationCode,
          }));
        };

        req.session[`${trialNumber}-${locationCode}-trial`].requiredNumberOfJurors = req.body.numberOfJurors;
        req.session[`${trialNumber}-${locationCode}-trial`].panelledJurors = resp;

        return res.redirect(app.namedRoutes.build('trial-management.empanel.select.get', {
          trialNumber,
          locationCode,
        }));
      }, err => {
        app.logger.crit('Failed to post empanel amount', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      });
    };
  };

  module.exports.getEmpanelJurors = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      const requiredNumberOfJurors = req.session[`${trialNumber}-${locationCode}-trial`].requiredNumberOfJurors;
      const availableJurors = req.session[`${trialNumber}-${locationCode}-trial`].panelledJurors.filter((juror) => juror.juror_status === 'Panel');
      let tmpErrors = _.clone(req.session[`${trialNumber}-${locationCode}-empanelJuryError`]);
      let tmpBody = _.clone(req.session.formFields);

      let BVRErrors = _.clone(req.session.errors);

      delete req.session.errors;
      delete req.session[`${trialNumber}-${locationCode}-empanelJuryError`];
      delete req.session.formFields;

      return res.render('trial-management/empanel-jury/select-jurors.njk', {
        submitUrl: app.namedRoutes.build('trial-management.empanel.select.post',  {
          trialNumber,
          locationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }),
        backLinkUrl: app.namedRoutes.build('trial-management.empanel.get', {
          trialNumber,
          locationCode,
        }),
        trialNumber,
        tmpErrors,
        tmpBody: tmpBody,
        jurors: availableJurors,
        requiredNumberOfJurors: requiredNumberOfJurors,
        errors: {
          title: 'Please check the form',
          count: typeof BVRErrors !== 'undefined' ? Object.keys(BVRErrors).length : 0,
          items: BVRErrors,
        },
      });
    };
  };

  module.exports.postEmpanelJurors = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;

      const tmpBody = req.body;
      const requiredNumberOfJurors = Number(req.session[`${trialNumber}-${locationCode}-trial`].requiredNumberOfJurors);

      delete tmpBody._csrf;
      delete tmpBody.requiredNumberOfJurors;

      const jurors = [];
      let juryCount = 0;
      const panel = {};
      const statuses = {
        juror: 'JUROR',
        unused: 'NOT_USED',
        challenged: 'CHALLENGED',
        returned: 'RETURNED',
      };

      req.session[`${trialNumber}-${locationCode}-trial`].panelledJurors.forEach(member => {
        panel[member.juror_number] = member;
      });

      for (const [key, value] of Object.entries(tmpBody)) {
        if (value === 'juror') {
          juryCount += 1;
        }
        jurors.push({
          ...panel[key],
          empanel_status: statuses[value],
        });
      };

      if (juryCount != requiredNumberOfJurors) {

        req.session[`${trialNumber}-${locationCode}-empanelJuryError`] = true;
        req.session.formFields = tmpBody;

        return res.redirect(app.namedRoutes.build('trial-management.empanel.select.get', {
          trialNumber,
          locationCode,
        }));
      }

      empanelJurorsDAO.post(app, req, {
        jurors,
        trial_number: trialNumber,
        court_location_code: locationCode,
        number_requested: requiredNumberOfJurors,
      }).then(() => {

        delete req.session[`${trialNumber}-${locationCode}-trial`];

        return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }));
      }, (err) => {

        app.logger.crit('Failed to empanel jurors', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        if (err.statusCode === 422) {
          if (err.error.code === 'JUROR_MUST_BE_CHECKED_IN') {
            req.session.errors = makeManualError('empanel error', '1 or more jurors have not been checked in today');
          } else {
            req.session.errors = makeManualError('empanel error', err.error.message);
          }

          return res.redirect(app.namedRoutes.build('trial-management.empanel.select.get', {
            trialNumber,
            locationCode,
          }));
        }

        return res.render('_errors/generic.njk');
      });
    };
  };

})();
