;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.smartSurveyResponseDAO = new DAO('', {
    get: function(surveyId, exportId, apiToken, apiTokenSecret, paramString) {
      const uri = urljoin(surveyId, 'exports', exportId, 'download', paramString);

      return { uri };
    }}
  );
})();
