(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObject = require('../../../objects/paper-reply').paperReplyObject;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const { hasBeenModified, generalError } = require('./summons-update-common');

  module.exports.get = function(app) {
    return async function(req, res) {
      const { id } = req.params;
      const postUrl = app.namedRoutes.build('summons.update-reply-type.post', {
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
        const { headers, data } = await paperReplyObject.get(
          req,
          req.params['id']
        );

        req.session[`summonsUpdate-${id}`] = {
          etag: headers['etag'],
        };

        let deferralValue = 'can-serve';

        if (data.excusal) {
          deferralValue = 'excusal-request';
        } else if (data.deferral) {
          deferralValue = 'deferral-request';
        }

        return res.render('summons-management/paper-reply/reply-types.njk', {
          postUrl,
          cancelUrl,
          deferralValue,
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
      // no need for validation as we can allow empty forms... will still pre-populated though (null means can-serve)
      const payload = {
        deferral: req.body['deferralValue'] === 'deferral-request',
        excusal: req.body['deferralValue'] === 'excusal-request',
      };

      try {
        const wasModified = await hasBeenModified(app, req);

        if (wasModified) {
          return res.redirect(app.namedRoutes.build('summons.update-reply-type.get', {
            id: req.params['id'],
            type: 'paper',
          }));
        }

        await summonsUpdate.patch(
          req,
          req.params['id'],
          'REPLYTYPE',
          payload
        );

        delete req.session[`summonsUpdate-${id}`];

        app.logger.info('Updated the summons reply type', {
          auth: req.session.authentication,
          jurorNumber: req.params['id'],
        });

        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      } catch (err) {
        app.logger.crit('Unable to update the summons reply type', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        generalError(req);

        return res.redirect(app.namedRoutes.build('summons.update-reply-type.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }
    };
  };

})();
