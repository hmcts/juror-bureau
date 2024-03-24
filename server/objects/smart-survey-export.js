;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.smartSurveyExportDAO = new DAO('', {
    get: function(surveyId, apiToken, apiTokenSecret, paramString) {
      const uri = urljoin(surveyId, 'exports', paramString);

      return { uri };
    }}
  );
})();
