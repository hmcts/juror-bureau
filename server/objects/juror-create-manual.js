(() => {
  'use strict';
  const { DAO } = require('./dataAccessObject');

  module.exports.jurorCreateObject = new DAO('moj/juror-record/create-juror')
  // TODO - Update with new endpoint
  module.exports.bureauCreateJuror = new DAO('moj/juror-record/bureau-create-juror')
})();
