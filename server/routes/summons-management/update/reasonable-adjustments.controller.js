(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
  const { systemCodesDAO } = require('../../../objects/administration');
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const validate = require('validate.js');
  const validator = require('../../../config/validation/paper-reply').reasonableAdjustments;
  const { hasBeenModified, generalError } = require('./summons-update-common');
  const { reasonsArrToObj } = require('../../../lib/mod-utils');

  module.exports.get = function(app) {
    return async function(req, res) {
      const { id } = req.params;
      const postUrl = app.namedRoutes.build('summons.update-adjustments.post', {
        id: req.params['id'],
        type: req.params['type'],
      });
      const cancelUrl = app.namedRoutes.build('response.paper.details.get', {
        id: req.params['id'],
        type: 'paper',
      });
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      try {
        const { headers, data } = await paperReplyObj.get(
          req,
          req.params['id']
        );

        req.session[`summonsUpdate-${id}`] = {
          etag: headers['etag'],
        };

        const adjustmentsResponse = {};
        let assistanceTypeDetails = '';

        if (!data.specialNeeds) {
          adjustmentsResponse['checked'] = true;
          adjustmentsResponse['value'] = 'no';
        } else {
          adjustmentsResponse['checked'] = true;
          adjustmentsResponse['value'] = 'yes';
          assistanceTypeDetails = data.specialNeeds[0].assistanceTypeDetails;
        }

        const adjustmentReasons = reasonsArrToObj(await systemCodesDAO.get(req, 'REASONABLE_ADJUSTMENTS'));

        const reasons = Object.keys(adjustmentReasons).reduce((prev, key) => {
          prev.push({
            value: key,
            text: adjustmentReasons[key],
            selected: (data.specialNeeds) ? key === data.specialNeeds[0].assistanceType : false,
          });
          return prev;
        }, []);

        return res.render('summons-management/paper-reply/adjustments.njk', {
          postUrl,
          cancelUrl,
          adjustmentsResponse,
          assistanceTypeDetails,
          reasons,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Unable to fetch the summons details', {
          auth: req.session.authentication,
          token: req.session.authToken,
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
      const payload = { specialNeeds: [] };

      if (req.body.adjustmentsResponse === 'yes') {
        payload.specialNeeds.push({
          assistanceType: req.body.adjustmentsReason,
          assistanceTypeDetails: req.body.assistanceTypeDetails,
        });
      }

      const validatorResult = validate(req.body, validator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('summons.update-adjustments.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }

      try {
        const wasModified = await hasBeenModified(app, req);

        if (wasModified) {
          return res.redirect(app.namedRoutes.build('summons.update-adjustments.get', {
            id: req.params['id'],
            type: 'paper',
          }));
        }

        await summonsUpdate.patch(
          req,
          req.params['id'],
          'ADJUSTMENTS',
          payload
        );

        app.logger.info('Updated the summons reasonable adjustments', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
        });

        delete req.session[`summonsUpdate-${id}`];

        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      } catch (err) {
        app.logger.crit('Unable to update the summons reasonable adjustments', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        generalError(req);

        return res.redirect(app.namedRoutes.build('summons.update-adjustments.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }
    };
  };

})();
