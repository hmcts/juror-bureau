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
        courtroomsObject.get(req),
        judgesObject.get(req),
        trialDetailsObject.get(
          req,
          trialNumber,
          locationCode
        ),
      ])
        .then(([courtrooms, judges, trial]) => {
          app.logger.info('Fetched trial details, courtrooms and judges list', {
            auth: req.session.authentication,
            data: {
              courtrooms,
              judges,
              trial,
            },
          });

          const courtroomsToDisplay = courtrooms.map((court) => {
            return {
              displayName: court.courtLocation,
              courtLocationName: court.courtLocation.replace(/[ .]/g, '_'),
              courtrooms: court.courtRooms.map(room => room.description),
            };
          });

          const judgesToDisplay = judges.judges.map(j => j.description);

          const originalTrial = {
            trialNumber,
            trialType: trial.trialType === 'Criminal' ? 'CRI' : 'CIV',
            defendants: trial.trialType === 'Criminal' ? trial.defendants : '',
            respondents: trial.trialType === 'Civil' ? trial.defendants : '',
            startDate: dateFilter(trial.startDate, 'yyyy-MM-dd', 'DD/MM/YYYY'),
            judge: trial.judge.description,
            courtroom: trial.courtroom.description,
            protected: trial.protected ? 'true' : 'false',
            courtLocationName: trial.courtRoomLocationName,
          };

          tmpErrors = _.clone(req.session.errors);
          tmpFields = typeof req.session[`${trialNumber}-${locationCode}-editTrial`] !== 'undefined'
            ? _.clone(req.session[`${trialNumber}-${locationCode}-editTrial`].tmpFields)
            : (typeof req.session.formFields !== 'undefined'
              ? _.clone(req.session.formFields)
              : originalTrial);
          delete req.session.errors;
          delete req.session.formFields;
          delete req.session[`${trialNumber}-${locationCode}-editTrial`];

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
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        });

    };
  };

  module.exports.postEditTrial = function(app) {
    return async function(req, res) {
      const { trialNumber, locationCode } = req.params;
      
      let judges;
      try {
        judges = (await judgesObject.get(req)).judges;
      } catch (err) {
        app.logger.crit('Failed to fetch judges: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic');
      }

      let courtrooms;
      try {
        courtrooms = (await courtroomsObject.get(req)).map((court) => {
          court.displayName = court.courtLocation;
          court.courtLocation = court.courtLocation.replace(/[ .]/g, '_');
          return court
        })
      } catch (err) {
        app.logger.crit('Failed to fetch courtrooms: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic');
      }

      if (courtrooms.length > 1){
        const courtroom = req.body[req.body.court];

        req.body.courtroom = courtroom;
      }

      let validatorResult = validate(req.body, createTrialValidator.trialDetails(courtrooms, judges, true));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('trial-management.edit-trial.get', { trialNumber, locationCode }));
      }

      const payload = trialPayloadBuilder(req.body, judges, courtrooms);

      let originalTrial;
      try {
        originalTrial = await trialDetailsObject.get(
          req,
          trialNumber,
          locationCode
        );
      } catch (err) {
        app.logger.crit('Failed to fetch trial details: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic');
      }

      if ((!originalTrial.protected && req.body.protected === 'true')
        || (originalTrial.protected && !req.body.protected)) {
        req.session[`${trialNumber}-${locationCode}-editTrial`] = {
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
        unprotected: req.session[`${trialNumber}-${locationCode}-editTrial`].tmpFields.protected !== 'true',
      });
    };
  };

  module.exports.postEditProtectedTrial = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;
      editTrial(app, req, res, req.session[`${trialNumber}-${locationCode}-editTrial`].payload);
    };
  };

  async function editTrial(app, req, res, payload){
    const { trialNumber, locationCode } = req.params; 
    try {
      const resp = await editTrialDAO.patch(req, payload);

      app.logger.info('Edited an existing trial', {
        auth: req.session.authentication,
        data: payload,
        response: resp,
      });

      if (typeof req.session[`${trialNumber}-${locationCode}-editTrial`] !== 'undefined') {
        delete req.session[`${trialNumber}-${locationCode}-editTrial`];
      };

      return res.redirect(
        app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: resp.trialNumber,
          locationCode: payload.courtLocation,
        })
      );
    } catch (err) {
      app.logger.crit('Failed to edit an existing trial: ', {
        auth: req.session.authentication,
        data: payload,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
      return res.render('_errors/generic');
    }
  }

})();
