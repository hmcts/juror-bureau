(() => {
  'use strict';
  const { DAO } = require('./dataAccessObject');

  module.exports.jurorCreateObject = new DAO('moj/juror-record/create-juror')
  module.exports.bureauCreateJuror = new DAO('moj/juror-record/create-juror-manual')
})();
