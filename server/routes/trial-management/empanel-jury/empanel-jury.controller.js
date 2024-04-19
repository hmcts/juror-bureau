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
      trialDetailsObject.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.trialNumber,
        req.params.locationCode
      ).then(trialData => {
        req.session.trial = trialData;

        const tmpErrors = _.clone(req.session.errors);
        let tmpBody = _.clone(req.session.formFields);

        delete req.session.errors;
        delete req.session.formFields;

        if (req.session.trialManagement) {
          tmpBody = req.session.trialManagement.empanelJury.numberOfJurors;
        };

        return res.render('trial-management/empanel-jury/index.njk', {
          submitUrl: app.namedRoutes.build('trial-management.empanel.post',  {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          }),
          cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
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
      requestPanelDAO.get(
        app,
        req,
        req.params.trialNumber,
        req.params.locationCode,
        req.body.numberOfJurors
      ).then(resp => {
        const noOfJurors = resp.length;
        const validatorResult = validate(req.body, validator.numberOfJurors(noOfJurors));

        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('trial-management.empanel.get', {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          }));
        };

        req.session.trial.requiredNumberOfJurors = req.body.numberOfJurors;
        req.session.trial.panelledJurors = resp;

        return res.redirect(app.namedRoutes.build('trial-management.empanel.select.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
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
      const requiredNumberOfJurors = req.session.trial.requiredNumberOfJurors;
      const availableJurors = req.session.trial.panelledJurors;
      let tmpErrors = _.clone(req.session.empanelJuryError);
      let tmpBody = _.clone(req.session.formFields);

      let BVRErrors = _.clone(req.session.errors);

      delete req.session.errors;
      delete req.session.empanelJuryError;
      delete req.session.formFields;

      return res.render('trial-management/empanel-jury/select-jurors.njk', {
        submitUrl: app.namedRoutes.build('trial-management.empanel.select.post',  {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
        backLinkUrl: app.namedRoutes.build('trial-management.empanel.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
        trialNumber: req.params.trialNumber,
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

      const tmpBody = req.body;
      const requiredNumberOfJurors = Number(req.session.trial.requiredNumberOfJurors);

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

      req.session.trial.panelledJurors.forEach(member => {
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

      if (juryCount < requiredNumberOfJurors) {

        req.session.empanelJuryError = true;
        req.session.formFields = tmpBody;

        return res.redirect(app.namedRoutes.build('trial-management.empanel.select.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }));
      }

      empanelJurorsDAO.post(app, req, {
        jurors,
        trial_number: req.params.trialNumber,
        court_location_code: req.params.locationCode,
        number_requested: requiredNumberOfJurors,
      }).then(() => {

        delete req.session.trial;
        delete req.session.trialManagement;

        return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
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
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          }));
        }

        return res.render('_errors/generic.njk');
      });
    };
  };

})();
