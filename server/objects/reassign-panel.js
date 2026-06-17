(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject')
  const { mapCamelToSnake } = require('../lib/mod-utils');

  module.exports.reassignPanelDAO = new DAO('moj/trial/reassign-panel-members', {
    post: function(body) {
      return {
        body: mapCamelToSnake(body),
      };
    }
  });

})();
