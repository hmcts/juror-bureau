;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const utils = require('../lib/utils');

  module.exports.object = new DAO('', {
    get: function(surveyId, paramString) {
      return {
        uri: urljoin(surveyId, 'exports', paramString),
        transform: utils.basicDataTransform,
        baseUrl: config.smartSurveyAPIEndpoint,
      }
    }
  });
})();
