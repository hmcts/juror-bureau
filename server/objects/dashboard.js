;(function(){
  'use strict';

  const _ = require('lodash');
  const { axiosClient } = require('./axios-instance');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const { basicDataTransform } = require('../lib/utils');  

  const dashboardStats = {
    resource: 'bureau/dashboard/statistics',
    post: async function(jwtToken, dashboardParams) {

      let url = this.resource;
      let options = {};

      options.body = replaceAllObjKeys(dashboardParams, _.snakeCase);
      options.headers = {
        'Content-type': 'application/vnd.api+json',
        'Accept': 'application/json'
      }

      return basicDataTransform(await axiosClient('post', url , jwtToken, options));
    },
  };

  module.exports.dashboardStats = dashboardStats;

})();
