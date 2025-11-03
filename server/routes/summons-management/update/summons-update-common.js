(function() {
  'use strict';

  const paperReplyObject = require('../../../objects/paper-reply').paperReplyObject;
  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.hasBeenModified = (app, req, replyMethod) => {
    return new Promise((resolve) => {
      const { id } = req.params;

      if (replyMethod !== 'paper') {
        return resolve(false);
      };

      try {
        const { headers } = paperReplyObject.get(
          req,
          id
        );

        if (headers.etag !== req.session[`summonsUpdate-${id}`].etag) {
          req.session.errors = makeManualError('updated', 'This summons has been modified');

          resolve(true);
        }

        resolve(false);
      } catch (err) {
        app.logger.crit('Unable to verify if the summons has been modified', {
          auth: req.session.authentication,
          data: {
            id,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }
    });
  };

  module.exports.generalError = function(req) {
    req.session.errors = makeManualError('error', 'Something went wrong when trying to save. Check your data and try again');
  };

})();
