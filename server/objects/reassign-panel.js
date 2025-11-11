(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject')
  const urljoin = require('url-join')

  module.exports.reassignPanelDAO = new DAO('moj/trial/reassign-panel-members');

})();