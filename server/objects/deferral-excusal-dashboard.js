;(function(){
  'use strict';

  const { axiosClient } = require('./axios-instance');
  const _ = require('lodash');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const { basicDataTransform2 } = require('../lib/utils');

  const deferralExcusalStats = {
    resource: 'bureau/dashboard/deferral-Excusal',
    post: function(jwtToken, dashboardParams) {

      let url = this.resource;
      let options = {};

      options.body = replaceAllObjKeys(dashboardParams, _.snakeCase);
      options.headers = {
        'Content-type': 'application/vnd.api+json',
        'Accept': 'application/json'
      }
      options.transform = basicDataTransform2;

      return axiosClient('post', url , jwtToken, options);
    },
  };

  module.exports.deferralExcusalStats = deferralExcusalStats;

})();
