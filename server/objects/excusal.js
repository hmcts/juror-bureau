;(function(){
  'use strict';

  const { basicDataTransform } = require('../lib/utils');
  const { axiosClient } = require('./axios-instance');

  module.exports.object = {
    get: async function(jwtToken) {

      let url = 'bureau/juror/excuse';
      let options = {};

      options.headers = {
        'Content-type': 'application/vnd.api+json',
        'Accept': 'application/json'
      };

      return basicDataTransform( await axiosClient('get', url , jwtToken, options));
    }
  };
})();
