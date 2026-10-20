;(function () {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const _ = require('lodash');

  module.exports.digitalByDefaultDashboardDAO = new DAO('moj/dbd-dashboard/statistics', {
    post: function (params) {
      return {
        body: params,
        transform: (data) => {
          delete data['_headers'];
          return replaceAllObjKeys(data, _.camelCase);
        },
      };
    },
  });

})();
