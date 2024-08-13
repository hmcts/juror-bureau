(function() {
  'use strict';

  const  _ = require('lodash');
  const { generatePanelDAO, availableJurorsDAO } = require('../../../objects/panel');
  const generatePanelValidator = require('../../../config/validation/generate-panel');
  const poolsValidator = require('../../../config/validation/generate-panel-pools');
  const validate = require('validate.js');;
  const { makeManualError } = require('../../../lib/mod-utils');


  const countErrors = (tmpErrors) => typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0;

  module.exports.getGeneratePanel = function(app) {
    return async function(req, res) {
      let tmpErrors
        , tmpFields;

      tmpErrors = _.clone(req.session.errors);
      tmpFields = _.clone(req.session.formFields);
      delete req.session.errors;
      delete req.session.formFields;

      return res.render('trial-management/generate-panel/generate-panel.njk', {
        processUrl: app.namedRoutes.build('trial-management.generate-panel.post', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
        panelDetails: tmpFields,
        errors: {
          count: countErrors(tmpErrors),
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postGeneratePanel = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      let validatorResult;

      validatorResult = validate(req.body, generatePanelValidator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('trial-management.generate-panel.get', {
          trialNumber,
          locationCode,
        }));
      }

      if (req.body.jurorType === 'specificPools') {
        req.session[`${trialNumber}-${locationCode}-noPanelJurors`] = +req.body.noJurors;

        return res.redirect(app.namedRoutes.build('trial-management.generate-panel.select-pools.get', {
          trialNumber: trialNumber,
          locationCode: locationCode,
        }));
      }

      return generatePanelDAO.post(app, req, {
        trial_number: trialNumber,
        number_requested: +req.body.noJurors,
        pool_numbers: [],
        court_location_code: locationCode,
      }).then((success) => {
        return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }));
      }, (err) => {
        if (err.statusCode === 422) {
          app.logger.warn('Failed to generate a panel from with a BVR', {
            auth: req.session.authentication,
            token: req.session.authToken,
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });

          req.session.errors = {
            generatePanelError: [{
              details: err.error.message,
              summary: err.error.message,
            }],
          };

          return res.redirect(app.namedRoutes.build('trial-management.generate-panel.get', {
            trialNumber,
            locationCode,
          }));
        }

        app.logger.crit('Failed to generate a panel from all available jurors', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      });
    };
  };

  module.exports.getSelectPools = function(app) {
    return async function(req, res) {
      const { trialNumber, locationCode } = req.params;
      let tmpErrors;

      tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;

      const noJurorsRequired = req.session[`${trialNumber}-${locationCode}-noPanelJurors`];

      availableJurorsDAO.get(app, req, locationCode).then(pools => {
        return res.render('trial-management/generate-panel/select-pools.njk', {
          pools,
          processUrl: app.namedRoutes.build('trial-management.generate-panel.select-pools.post', {
            trialNumber,
            locationCode,
          }),
          cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
            trialNumber,
            locationCode,
          }),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('trial-management.generate-panel.get', {
              trialNumber,
              locationCode,
            }),
          },
          noJurorsRequired: noJurorsRequired,
          errors: {
            count: countErrors(tmpErrors),
            items: tmpErrors,
          },
        });
      }, (err) => {
        app.logger.crit('Failed to fetch available jurors/pools', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      });
    };
  };

  module.exports.postSelectPools = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      let validatorResult
        , selectedPools;

      validatorResult = validate(req.body, poolsValidator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        return res.redirect(app.namedRoutes.build('trial-management.generate-panel.select-pools.get', {
          trialNumber,
          locationCode,
        }));
      }

      delete req.session.errors;

      if (!Array.isArray(req.body.selectedPools)) {
        selectedPools = [req.body.selectedPools];
      } else {
        selectedPools = req.body.selectedPools;
      }
      return generatePanelDAO.post(app, req, {
        trial_number: trialNumber,
        number_requested: +req.session[`${trialNumber}-${locationCode}-noPanelJurors`],
        pool_numbers: selectedPools,
        court_location_code: locationCode,
      }).then((success) => {
        delete req.session[`${trialNumber}-${locationCode}-noPanelJurors`];

        return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }));
      }, (err) => {
        app.logger.crit('Failed to generate a panel of jurors from specific pools', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        req.session.errors = makeManualError('Pool selection', err.error.message);

        return res.redirect(app.namedRoutes.build('trial-management.generate-panel.select-pools.get', {
          trialNumber,
          locationCode,
        }));
      });
    };
  };
})();

