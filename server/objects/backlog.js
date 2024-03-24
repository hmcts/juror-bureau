;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.backlogDAO = new DAO('bureau/allocate/replies');
  module.exports.allocateBacklogDAO = new DAO('bureau/backlogAllocate/replies');
})();
