; (function() {
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { basicDataTransform2 } = require('../lib/utils');
  const { replaceAllObjKeys } = require('../lib/mod-utils');


  module.exports.getDisqualificationReasons = new DAO('moj/disqualify/reasons');

  module.exports.disqualifyJuror = new DAO('moj/disqualify/juror', {
    patch: function(jurorNumber, payload) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body: payload,
        transform: basicDataTransform2,
      }
    }
  });
})();
