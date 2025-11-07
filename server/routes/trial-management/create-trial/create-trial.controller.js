/* eslint-disable camelcase */
(function() {
  'use strict';

  const _ = require('lodash');
  const createTrialValidator = require('../../../config/validation/create-trial');
  const validate = require('validate.js');
  const { courtroomsObject, judgesObject, createTrialObject } = require('../../../objects/create-trial');
  const { dateFilter } = require('../../../components/filters');
  const { makeManualError } = require('../../../lib/mod-utils');

  const countErrors = (tmpErrors) => typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0;

  module.exports.getCreateTrial = function(app) {
    return async function(req, res) {
      let tmpErrors
        , tmpFields;

      let promiseArr = [];

      promiseArr.push(courtroomsObject.get(req));

      promiseArr.push(judgesObject.get(req));

      Promise.all(promiseArr)
        .then((data) => {

          app.logger.info('Fetched courtrooms and judges list', {
            auth: req.session.authentication,
          });

          const courtrooms = data[0];
          const judges = data[1];
          const courtroomsToDisplay = courtrooms.map((court) => {
            return {
                displayName: court.court_location,
                courtLocationName: court.court_location.replace(/[ .]/g, '_'),
                courtrooms: court.court_rooms.map(room => room.description),
              };
          });

          const judgesToDisplay = judges.judges.map(j => j.description);

          tmpErrors = _.clone(req.session.errors);
          tmpFields = typeof req.session.createTrial !== 'undefined' ?
            _.clone(req.session.createTrial.tmpFields) : _.clone(req.session.formFields);
          delete req.session.errors;
          delete req.session.formFields;
          delete req.session.createTrial;

          return res.render('trial-management/create-trial.njk', {
            nav: 'trials',
            courts: courtroomsToDisplay,
            judges: judgesToDisplay,
            processUrl: app.namedRoutes.build('trial-management.create-trial.post'),
            cancelUrl: app.namedRoutes.build('trial-management.trials.get'),
            trialDetails: tmpFields,
            errors: {
              count: countErrors(tmpErrors),
              items: tmpErrors,
            },
          });

        })
        .catch((err) => {
          app.logger.crit('Failed to fetch judges or courtrooms list: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        });

    };
  };

  module.exports.postCreateTrial = function(app) {
    return async function(req, res) {
      let judges;
      try {
        judges = (await judgesObject.get(req)).judges;
      } catch (err) {
        app.logger.crit('Failed to fetch judges: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic', { err });
      }

      let courtrooms;
      try {
        courtrooms = (await courtroomsObject.get(req)).map((court) => {
          court.display_name = court.court_location;
          court.court_location = court.court_location.replace(/[ .]/g, '_');
          return court
        })
      } catch (err) {
        app.logger.crit('Failed to fetch courtrooms: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic', { err });
      }

      if (courtrooms.length > 1){
        const courtroom = req.body[req.body.court];

        req.body.courtroom = courtroom;
      }

      let validatorResult = validate(req.body, createTrialValidator.trialDetails(courtrooms, judges));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('trial-management.create-trial.get'));
      }

      const payload = trialPayloadBuilder(req.body, judges, courtrooms);

      if (req.body.protected === 'true') {
        req.session.createTrial = {
          payload: _.clone(payload),
          tmpFields: req.body,
        };

        return res.redirect(app.namedRoutes.build('trial-management.create-trial-confirm-protected.get'));
      }

      createTrial(app, req, res, payload);
    };
  };

  module.exports.getCreateProtectedTrial = function(app) {
    return function(req, res) {
      return res.render('trial-management/confirm-protected-trial.njk', {
        processUrl: app.namedRoutes.build('trial-management.create-trial-confirm-protected.post'),
        cancelUrl: app.namedRoutes.build('trial-management.create-trial.get'),
      });
    };
  };

  module.exports.postCreateProtectedTrial = function(app) {
    return function(req, res) {
      createTrial(app, req, res, req.session.createTrial.payload);
    };
  };

  function trialPayloadBuilder(body, judges, courtrooms){
    const payload = {};
    let courtroom
      , courtroomsDetails;

    payload.case_number = body.trialNumber;
    payload.trial_type = body.trialType;
    payload.defendant = body.trialType === 'CRI' ? body.defendants : body.respondents;
    payload.start_date = dateFilter(body.startDate, 'DD/MM/YYYY', 'YYYY-MM-DD');
    payload.judge_id = judges.find(j => {
      return j.description === body.judge;
    }).id;

    if (body.court) {
      courtroomsDetails = courtrooms.find(c => {
        return c.court_location === body.court;
      }).court_rooms;
    } else {
      courtroomsDetails = courtrooms[0].court_rooms;
    }

    courtroom = courtroomsDetails.find(cr => {
      return cr.description === body.courtroom;
    });

    payload.court_location = courtroom.loc_code;
    payload.courtroom_id = courtroom.id;

    payload.protected_trial = body.protected ? true : false;

    return payload;
  }

  function createTrial(app, req, res, payload){
    createTrialObject.post(req, payload)
      .then((resp) => {
        app.logger.info('Created a new trial', {
          auth: req.session.authentication,
          data: {
            trialNumber: payload.case_number
          }
        });

        if (typeof req.session.createTrial !== 'undefined') {
          delete req.session.createTrial;
        };

        return res.redirect(
          app.namedRoutes.build('trial-management.trials.detail.get', {
            trialNumber: resp.trial_number,
            locationCode: payload.court_location,
          })
        );
      })
      .catch((err) => {
        app.logger.crit('Failed to create a new trial: ', {
          auth: req.session.authentication,
          data: {
            trialNumber: payload.case_number
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.error?.message) {
          req.session.errors = makeManualError('createTrial', err.error.message);
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('trial-management.create-trial.get'));
        }

        return res.render('_errors/generic', { err });
      });
  }

  module.exports.trialPayloadBuilder = trialPayloadBuilder;

})();
