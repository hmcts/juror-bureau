(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const hasBeenModified = require('./summons-update-common').hasBeenModified;

  module.exports.get = function(app) {
    return async function(req, res) {
      const postUrl = app.namedRoutes.build('summons.update-signature.post', {
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
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['id']
        );

        req.session.summonsUpdate = {
          etag: headers['etag'],
        };

        return res.render('summons-management/paper-reply/signature.njk', {
          postUrl,
          cancelUrl,
          signed: data.signed,
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
      const payload = {
        signature: null,
      };

      switch (req.body.signed) {
      case 'yes':
        payload.signature = true;
        break;
      case 'no':
        payload.signature = false;
        break;
      }

      try {
        const wasModified = await hasBeenModified(app, req);

        if (wasModified) {
          return res.redirect(app.namedRoutes.build('summons.update-signature.get', {
            id: req.params['id'],
            type: 'paper',
          }));
        }

        await summonsUpdate.patch(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['id'],
          'SIGNATURE',
          payload
        );

        delete req.session.summonsUpdate;

        app.logger.info('Successfully updated the summons signature', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
        });

        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      } catch (err) {
        app.logger.crit('Unable to update the summons signature', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.redirect(app.namedRoutes.build('summons.update-signature.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }
    };
  };

})();
