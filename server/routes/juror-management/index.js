(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./juror-management.controller');

  module.exports = function(app) {
    require('./juror-record/index')(app);
    require('./search/index')(app);
    require('./update/index')(app);
    require('./reassign/index')(app);
    require('./excusal/index')(app);
    require('./edit/index')(app);
    require('./postpone/index')(app);
    require('./police-check/index')(app);
    require('./new-name/index')(app);
    require('./attendance/index')(app);
    require('./manage-jurors/index')(app);
    require('./create-record-manual/index')(app);
    require('./unpaid-attendance')(app);
    require('./expenses/index')(app);
    require('./approve-expenses/index')(app);
    require('./jurors-on-trial/index')(app);

    app.get('/juror-management/attendance/:status?',
      'juror-management.attendance.get',
      auth.verify,
      controller.getAttendance(app),
    );

  };
})();
