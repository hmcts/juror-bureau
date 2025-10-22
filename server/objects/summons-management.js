(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');
  const urljoin = require('url-join').default;

  module.exports.requestInfoObject = new DAO('moj/letter/request-information', {
    post: function(jurorNumber, data, replyMethod) {
      return {
        uri: urljoin(this.resource),
        body: {
          informationRequired: data,
          jurorNumber: jurorNumber,
          replyMethod: replyMethod,
        },
        transform: basicDataTransform,
      };
    },
  });

  module.exports.updateStatus = new DAO('moj/juror-paper-response/update-status', {
    put: function(jurorNumber, key) {
      return {
        uri: urljoin(this.resource, jurorNumber, key),
        transform: basicDataTransform,
      };
    },
  });

  module.exports.summonsUpdate = {
    resource: {
      BASE: 'moj/juror-paper-response/juror/{}/details',
      PERSONAL: 'moj/juror-response/juror/{}/details/personal',
      ELIGIBILITY: 'eligibility',
      REPLYTYPE: 'reply-type',
      CJS: 'cjs',
      ADJUSTMENTS: 'special-needs',
      SIGNATURE: 'signature',
    },
    patch: function(req, id, part, payload) {
      let uri;

      if (part === 'PERSONAL') {
        uri = urljoin(this.resource['PERSONAL'].replace('{}', id));
      } else {
        uri = urljoin(this.resource['BASE'].replace('{}', id), this.resource[part]);
      }

      const dao = new DAO(uri, {
        patch: function(body) {
          return {
            uri: uri,
            body,
            transform: basicDataTransform,
          };
        },
      });

      return dao.patch(req, payload);
    }
  };

})();
