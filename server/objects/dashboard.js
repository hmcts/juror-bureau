;(function(){
  'use strict';

  const { axiosInstance } = require('./axios-instance');
  const { axiosClient } = require('./axios-instance');


  const dashboardStats = {
    resource: 'bureau/dashboard/statistics',
    post: function(jwtToken, dashboardParams) {

      let url = this.resource;
      let options = {};

      options.body = dashboardParams;
      options.headers = {
        'Content-type': 'application/vnd.api+json',
        'Accept': 'application/json'
      }

      return axiosClient('post', url , jwtToken, options);
    },
  };

  module.exports.dashboardStats = dashboardStats;

})();
