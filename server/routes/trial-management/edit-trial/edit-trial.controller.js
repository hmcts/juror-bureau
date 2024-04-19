/* eslint-disable camelcase */
(function() {
  'use strict';

  const  _ = require('lodash');
  const validate = require('validate.js');
  const createTrialValidator = require('../../../config/validation/create-trial');
  const { courtroomsObject, judgesObject, trialDetailsObject, editTrialDAO } = require('../../../objects/create-trial');
  const { dateFilter } = require('../../../components/filters');
  const { trialPayloadBuilder } = require('../create-trial/create-trial.controller');

  const countErrors = (tmpErrors) => typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0;

  module.exports.getEditTrial = function(app) {
    return async function(req, res) {
      const { trialNumber, locationCode } = req.params;
      let tmpErrors;
      let tmpFields;

      Promise.all([
        courtroomsObject.get(
          require('request-promise'),
          app,
          req.session.authToken
        ),
        judgesObject.get(
          require('request-promise'),
          app,
          req.session.authToken
        ),
        trialDetailsObject.get(
          require('request-promise'),
          app,
          req.session.authToken,
          trialNumber,
          locationCode
        ),
      ])
        .then(([courtrooms, judges, trial]) => {

          app.logger.info('Fetched trial details, courtrooms and judges list', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              courtrooms,
              judges,
              trial,
            },
          });

          const courtroomsToDisplay = [];

          req.session.judges = judges.judges;
          req.session.courtrooms = courtrooms.map((court) => {

            court.display_name = court.court_location;
            court.court_location = court.court_location.replace(/ /g, '_');

            courtroomsToDisplay.push(
              {
                displayName: court.display_name,
                courtLocationName: court.court_location,
                courtrooms: court.court_rooms.map(room => room.description),
              }
            );

            return court;
          });

          const judgesToDisplay = judges.judges.map(j => j.description);

          const originalTrial = {
            trialNumber,
            trialType: trial.trial_type === 'Criminal' ? 'CRI' : 'CIV',
            defendants: trial.trial_type === 'Criminal' ? trial.defendants : '',
            respondents: trial.trial_type === 'Civil' ? trial.defendants : '',
            startDate: dateFilter(trial.startDate, null, 'DD/MM/YYYY'),
            judge: trial.judge.description,
            courtroom: trial.courtroom.description,
            protected: trial.protected ? 'true' : 'false',
          };

          req.session.orignalTrial = {
            protected: trial.protected,
          };

          tmpErrors = _.clone(req.session.errors);
          tmpFields = typeof req.session.editTrial !== 'undefined'
            ? _.clone(req.session.editTrial.tmpFields)
            : (typeof req.session.formFields !== 'undefined'
              ? _.clone(req.session.formFields)
              : originalTrial);
          delete req.session.errors;
          delete req.session.formFields;
          delete req.session.editTrial;

          return res.render('trial-management/create-trial.njk', {
            nav: 'trials',
            editTrial: true,
            trialNumber,
            originalTrial,
            courts: courtroomsToDisplay,
            judges: judgesToDisplay,
            processUrl: app.namedRoutes.build('trial-management.edit-trial.post', { trialNumber, locationCode }),
            cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', { trialNumber, locationCode }),
            trialDetails: tmpFields,
            errors: {
              count: countErrors(tmpErrors),
              items: tmpErrors,
            },
          });

        })
        .catch((err) => {
          app.logger.crit('Failed to fetch trial details, judges or courtrooms list: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        });

    };
  };

  module.exports.postEditTrial = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      const judges = _.clone(req.session.judges);
      const courtrooms = _.clone(req.session.courtrooms);

      delete req.session.judges;
      delete req.session.courtrooms;

      if (courtrooms.length > 1){
        const courtroom = req.body[req.body.court];

        req.body.courtroom = courtroom;
      }

      let validatorResult = validate(req.body, createTrialValidator.trialDetails(courtrooms, judges));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('trial-management.edit-trial.get', { trialNumber, locationCode }));
      }

      const payload = trialPayloadBuilder(req.body, judges, courtrooms);

      if ((!req.session.orignalTrial.protected && req.body.protected === 'true')
        || (req.session.orignalTrial.protected && !req.body.protected)) {
        req.session.editTrial = {
          payload: _.clone(payload),
          tmpFields: req.body,
        };
        return res.redirect(app.namedRoutes.build('trial-management.edit-trial-confirm-protected.get', {
          trialNumber,
          locationCode,
        }));
      }

      editTrial(app, req, res, payload);
    };
  };

  module.exports.getEditProtectedTrial = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;

      return res.render('trial-management/confirm-protected-trial.njk', {
        processUrl: app.namedRoutes.build('trial-management.edit-trial-confirm-protected.post', {
          trialNumber,
          locationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.edit-trial.get', {
          trialNumber,
          locationCode,
        }),
        unprotected: req.session.editTrial.tmpFields.protected !== 'true',
      });
    };
  };

  module.exports.postEditProtectedTrial = function(app) {
    return function(req, res) {
      editTrial(app, req, res, req.session.editTrial.payload);
    };
  };

  async function editTrial(app, req, res, payload){
    try {
      const resp = await editTrialDAO.patch(req, payload);

      app.logger.info('Edited an existing trial', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: payload,
        response: resp,
      });

      if (typeof req.session.editTrial !== 'undefined') {
        delete req.session.editTrial;
      };

      return res.redirect(
        app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: resp.trial_number,
          locationCode: payload.court_location,
        })
      );
    } catch (err) {
      app.logger.crit('Failed to edit an existing trial: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: payload,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
      return res.render('_errors/generic');
    }
  }

})();
