(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const { hasBeenModified, generalError } = require('./summons-update-common');
  const { getEligibilityDetails, mergeMentalHealthInfo, createEligibilityObject } = require('../paper-reply/paper-reply.controller');
  const paperReplyValidator = require('../../../config/validation/paper-reply');
  const { validate } = require('validate.js');

  module.exports.get = function(app) {
    return async function(req, res) {
      const { id } = req.params;
      const postUrl = app.namedRoutes.build('summons.update-eligibility.post', {
        id: req.params['id'],
        type: req.params['type'],
      });
      const cancelUrl = app.namedRoutes.build('response.paper.details.get', {
        id: req.params['id'],
        type: 'paper',
      }) + '#eligibility';
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      try {
        const { headers, data } = await paperReplyObj.get(
          req,
          req.params['id']
        );

        req.session[`summonsUpdate-${id}`] = {
          etag: headers['etag'],
        };

        return res.render('summons-management/paper-reply/eligibility.njk', {
          postUrl,
          cancelUrl,
          eligibilityDetails: tmpBody || getEligibilityDetails(data.eligibility),
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Unable to fetch the summons details', {
          auth: req.session.authentication,
          data: {
            id: req.params['id'],
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.post = function(app) {
    return async function(req, res) {
      const { id } = req.params;

      const eligibility = createEligibilityObject(req.body);

      const validatorResult = validate(req.body, paperReplyValidator.eligibility());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('summons.update-eligibility.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }

      mergeMentalHealthInfo(eligibility);

      try {
        const wasModified = await hasBeenModified(app, req);

        if (wasModified) {
          return res.redirect(app.namedRoutes.build('summons.update-eligibility.get', {
            id: req.params['id'],
            type: 'paper',
          }));
        }

        await summonsUpdate.patch(
          req,
          req.params['id'],
          'ELIGIBILITY',
          {
            eligibility,
          },
        );

        delete req.session[`summonsUpdate-${id}`];

        app.logger.info('Successfully updated the juror eligibility: ', {
          auth: req.session.authentication,
          data: {
            summonsId: req.params['id'],
          },
        });

        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params['id'],
          type: 'paper',
        }) + '#eligibility');
      } catch (err) {
        app.logger.crit('Could not update the summons eligibility details', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        generalError(req);

        return res.redirect(app.namedRoutes.build('summons.update-eligibility.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }
    };
  };

})();
