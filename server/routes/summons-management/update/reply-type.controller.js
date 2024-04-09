(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObject = require('../../../objects/paper-reply').paperReplyObject;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const hasBeenModified = require('./summons-update-common').hasBeenModified;

  module.exports.get = function(app) {
    return async function(req, res) {
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
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['id']
        );

        req.session.summonsUpdate = {
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
          token: req.session.authToken,
          data: {
            id: req.params['id'],
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.post = function(app) {
    return async function(req, res) {
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
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['id'],
          'REPLYTYPE',
          payload
        );

        delete req.session.summonsUpdate;

        app.logger.info('Updated the summons reply type', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
        });

        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      } catch (err) {
        app.logger.crit('Unable to update the summons reply type', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.errors = {
          replyTypeError: [{
            summary: 'Something went wrong when trying to update the summons reply type',
            details: 'Something went wrong when trying to update the summons reply type',
          }],
        };

        return res.redirect(app.namedRoutes.build('summons.update-reply-type.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }
    };
  };

})();
