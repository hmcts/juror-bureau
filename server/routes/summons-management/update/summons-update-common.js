(function() {
  'use strict';

  const paperReplyObject = require('../../../objects/paper-reply').paperReplyObject;

  module.exports.hasBeenModified = function(app, req, replyMethod) {
    return new Promise((resolve) => {
      const { id } = req.params;

      if (replyMethod !== 'paper') {
        return resolve(false);
      };

      paperReplyObject.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params['id']
      ).then(({headers}) => {
        if (headers.etag !== req.session[`summonsUpdate-${id}`].etag) {
          req.session.errors = {
            updated: [{
              summary: 'This summons has been modified',
              details: 'This summons has been modified',
            }],
          };

          resolve(true);
        }

        resolve(false);
      });
    });
  };

  module.exports.generalError = function(req) {
    req.session.errors = {
      error: [{
        details: 'Something went wrong when trying to save. Check your data and try again',
        summary: 'Something went wrong when trying to save. Check your data and try again',
      }],
    };
  };

})();
