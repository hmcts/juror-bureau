(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  const summonUris = {
    BASE: 'moj/juror-paper-response/juror/{}/details',
    PERSONAL: 'moj/juror-response/juror/{}/details/personal',
    ELIGIBILITY: 'eligibility',
    REPLYTYPE: 'reply-type',
    CJS: 'cjs',
    ADJUSTMENTS: 'special-needs',
    SIGNATURE: 'signature',
  };

  module.exports.requestInfoDAO = new DAO('moj/letter/request-information', {
    post: function(jurorNumber, data, replyMethod) {
      const body = {
        informationRequired: data,
        jurorNumber: jurorNumber,
        replyMethod: replyMethod,
      };

      return { body };
    }}
  );

  module.exports.updateStatusDAO = new DAO('moj/juror-paper-response/update-status', {
    put: function(jurorNumber, key) {
      const uri = urljoin(this.resource, jurorNumber, key);

      return { uri };
    }}
  );

  module.exports.summonsUpdateDAO = new DAO('', {
    patch: function(id, part, payload) {
      let uri;

      if (part === 'PERSONAL') {
        uri = urljoin(summonUris['PERSONAL'].replace('{}', id));
      } else {
        uri = urljoin(summonUris['BASE'].replace('{}', id), summonUris[part]);
      }

      return { uri, body: payload };
    }}
  );
})();
