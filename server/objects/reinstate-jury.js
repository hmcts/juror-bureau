(function() {
  'use strict';

  const _ = require('lodash');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const { DAO } = require('./dataAccessObject')
  const urljoin = require('url-join')

  module.exports.getReturnedJurors = new DAO('moj/trial/get-returned-jurors', {
    get: function(trialNumber, locCode) {
      const params = new URLSearchParams({ trial_number: trialNumber, location_code: locCode });

      return {
        uri: urljoin(
          this.resource,
          `?${params.toString()}`,
        ),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase); },
      }
    }
  });

  module.exports.reinstateJurors = new DAO('moj/trial/reinstate-jurors', {
    post: function(payload) {
      return {
        uri: this.resource,
        body: replaceAllObjKeys(payload, _.snakeCase),
      }
    }
  });

})();