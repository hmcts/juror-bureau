(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const { hasBeenModified, generalError } = require('./summons-update-common');

  module.exports.get = (app) => async (req, res) => {
    const { id, type } = req.params;
    const postUrl = app.namedRoutes.build('summons.update-signature.post', { id, type });
    const cancelUrl = app.namedRoutes.build('response.paper.details.get', { id, type: 'paper' });
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    try {
      const { headers, data } = await paperReplyObj.get(
        req,
        id
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
        data: {
          id,
        },
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }
  };

  module.exports.post = (app) => async (req, res) => {
    const { id, type }= req.params;
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
        return res.redirect(app.namedRoutes.build('summons.update-signature.get', { id, type: 'paper' }));
      }

      await summonsUpdate.patch(
        req,
        id,
        'SIGNATURE',
        payload
      );

      delete req.session[`summonsUpdate-${id}`];

      app.logger.info('Successfully updated the summons signature', {
        auth: req.session.authentication,
        jurorNumber: id,
      });

      return res.redirect(app.namedRoutes.build('response.paper.details.get', { id, type: 'paper' }));
    } catch (err) {
      app.logger.crit('Unable to update the summons signature', {
        auth: req.session.authentication,
        jurorNumber: id,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      generalError(req);

      return res.redirect(app.namedRoutes.build('summons.update-signature.get', { id, type: 'paper' }));
    }
  };

})();
