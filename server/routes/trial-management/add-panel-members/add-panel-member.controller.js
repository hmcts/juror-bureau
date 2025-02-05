(function() {
  'use strict';

  const  _ = require('lodash');
  const addPanelMembersValidator = require('../../../config/validation/add-panel-members');
  const { addPanelMembersDAO, availableJurorsDAO } = require('../../../objects');
  const poolsValidator = require('../../../config/validation/generate-panel-pools');
  const validate = require('validate.js');
  const countErrors = (tmpErrors) => typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0;

  module.exports.getAddPanelMember = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('trial-management/add-panel-members/index.njk', {
        processUrl: app.namedRoutes.build('trial-management.add-panel-members.post', {
          trialNumber,
          locationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }),
        panelDetails: tmpFields,
        errors: {
          count: countErrors(tmpErrors),
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postAddPanelMember = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      const validatorResult = validate(req.body, addPanelMembersValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('trial-management.add-panel-members.get', {
          trialNumber,
          locationCode,
        }));
      }

      if (req.body.jurorType === 'specificPools') {
        req.session[`${trialNumber}-${locationCode}-noPanelJurors`] = +req.body.noJurors;
        return res.redirect(app.namedRoutes.build('trial-management.add-panel-members.select-pools.get', {
          trialNumber,
          locationCode,
        }));
      }

      return addPanelMembersDAO.post(req, {
        'trialNumber': trialNumber,
        'numberRequested': +req.body.noJurors,
        'poolNumbers': [],
        'courtLocationCode': locationCode,
      }).then(() => {
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

          return res.redirect(app.namedRoutes.build('trial-management.add-panel-members.get', {
            trialNumber,
            locationCode,
          }));
        }

        app.logger.crit('Failed to add panel members from all available jurors', {
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
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      const noJurorsRequired = req.session[`${trialNumber}-${locationCode}-noPanelJurors`];

      availableJurorsDAO.get(req, locationCode).then(pools => {

        return res.render('trial-management/generate-panel/select-pools.njk', {
          pools,
          processUrl: app.namedRoutes.build('trial-management.add-panel-members.select-pools.post', {
            trialNumber,
            locationCode,
          }),
          cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
            trialNumber,
            locationCode,
          }),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('trial-management.add-panel-members.get', {
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
      let selectedPools;
      const validatorResult = validate(req.body, poolsValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        return res.redirect(app.namedRoutes.build('trial-management.add-panel-members.select-pools.get', {
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
      return addPanelMembersDAO.post(req, {
        'trialNumber': trialNumber,
        'numberRequested': +req.session[`${trialNumber}-${locationCode}-noPanelJurors`],
        'poolNumbers': selectedPools,
        'courtLocationCode': locationCode,
      }).then(() => {
        delete req.session[`${trialNumber}-${locationCode}-noPanelJurors`];

        return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }));
      }, (err) => {
        app.logger.crit('Failed to add jurors from specific pools', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');

      });
    };
  };

})();
