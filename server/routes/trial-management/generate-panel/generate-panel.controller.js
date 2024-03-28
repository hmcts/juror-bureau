const _ = require('lodash');
const { generatePanelDAO, availableJurorsDAO } = require('../../../objects/panel');
const generatePanelValidator = require('../../../config/validation/generate-panel');
const poolsValidator = require('../../../config/validation/generate-panel-pools');
const validate = require('validate.js');
const { makeManualError } = require('../../../lib/mod-utils');


const countErrors = (tmpErrors) => typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0;

module.exports.getGeneratePanel = function (app) {
  return async function (req, res) {
    let tmpErrors;
    let tmpFields;

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

module.exports.postGeneratePanel = function (app) {
  return function (req, res) {
    let validatorResult;

    validatorResult = validate(req.body, generatePanelValidator());
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('trial-management.generate-panel.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    if (req.body.jurorType === 'specificPools') {
      req.session.noPanelJurors = +req.body.noJurors;
      return res.redirect(app.namedRoutes.build('trial-management.generate-panel.select-pools.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    return generatePanelDAO.post(app, req, {
      trial_number: req.params.trialNumber,
      number_requested: +req.body.noJurors,
      pool_numbers: [],
      court_location_code: req.params.locationCode,
    }).then((success) => {
      return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
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
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
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

module.exports.getSelectPools = function (app) {
  return async function (req, res) {
    let tmpErrors;

    tmpErrors = _.clone(req.session.errors);
    delete req.session.errors;

    const noJurorsRequired = req.session.noPanelJurors;

    availableJurorsDAO.get(app, req, req.params.locationCode).then(pools => {
      return res.render('trial-management/generate-panel/select-pools.njk', {
        pools,
        processUrl: app.namedRoutes.build('trial-management.generate-panel.select-pools.post', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('trial-management.generate-panel.get', {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
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

module.exports.postSelectPools = function (app) {
  return function (req, res) {
    let validatorResult;
    let selectedPools;

    validatorResult = validate(req.body, poolsValidator());
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      return res.redirect(app.namedRoutes.build('trial-management.generate-panel.select-pools.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    req.session.poolJurorsTransfer = req.body;
    delete req.session.errors;

    if (!Array.isArray(req.body.selectedPools)) {
      selectedPools = [req.body.selectedPools];
    } else {
      selectedPools = req.body.selectedPools;
    }
    return generatePanelDAO.post(app, req, {
      trial_number: req.params.trialNumber,
      number_requested: +req.session.noPanelJurors,
      pool_numbers: selectedPools,
      court_location_code: req.params.locationCode,
    }).then((success) => {
      delete req.session.noPanelJurors;

      return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }, (err) => {
      app.logger.crit('Failed to generate a panel of jurors from specific pools', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      req.session.errors = makeManualError('Pool selection', err.error.message);

      return res.redirect(app.namedRoutes.build('trial-management.generate-panel.select-pools.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    });
  };
};
