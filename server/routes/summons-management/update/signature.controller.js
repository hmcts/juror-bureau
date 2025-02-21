(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const { hasBeenModified, generalError } = require('./summons-update-common');

  module.exports.get = function(app) {
    return async function(req, res) {
      const { id } = req.params;
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
          req,
          req.params['id']
        );

        req.session[`summonsUpdate-${id}`] = {
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

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.post = function(app) {
    return async function(req, res) {
      const { id } = req.params;
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
          req,
          req.params['id'],
          'SIGNATURE',
          payload
        );

        delete req.session[`summonsUpdate-${id}`];

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

        generalError(req);

        return res.redirect(app.namedRoutes.build('summons.update-signature.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }
    };
  };

})();
