(function(){
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , jurorSelectValidator = require('../../../../config/validation/change-attendance-date').jurorSelect
    , attendanceDateValidator = require('../../../../config/validation/change-attendance-date').bulkAttendanceDate
    , { dateFilter } = require('../../../../components/filters');


  module.exports.postChangeAttendanceDate = function(app) {
    return function(req, res) {
      const checkedJurors = req.session.membersList.filter(j => j.checked).map(j => j.jurorNumber);

      const validatorResult = validate({selectedJurors: checkedJurors}, jurorSelectValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-overview.get', { poolNumber: req.params['poolNumber'] }));
      }

      delete req.session.membersList;
      delete req.session.filteredMembers;
      delete req.session.filters;

      req.session.selectedJurors = checkedJurors;

      return res.redirect(app.namedRoutes.build('pool-overview.change-next-attendance.continue.get',
        {poolNumber: req.params.poolNumber}));
    };
  };

  module.exports.getChangeAttendanceDateContinue = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      const today = new Date();
      let tomorrow = new Date();

      tomorrow.setDate(today.getDate() + 1);

      return res.render('pool-management/change-next-attendance-date/change-next-attendance-date', {
        processUrl: app.namedRoutes.build('pool-overview.change-next-attendance.continue.post',
          {poolNumber: req.params.poolNumber}),
        cancelUrl: app.namedRoutes.build('pool-overview.get',
          { poolNumber: req.params.poolNumber }),
        minDate: dateFilter(new Date(), null, 'DD/MM/YYYY'),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        formDetails: typeof tmpBody !== 'undefined'
          ? tmpBody
          : {attendanceDate: dateFilter(tomorrow, null, 'DD/MM/YYYY')},
      });
    };
  };

  module.exports.postChangeAttendanceDateContinue = function(app) {
    return function(req, res) {
      let validatorResult;

      validatorResult = validate(req.body, attendanceDateValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(
          app.namedRoutes.build('pool-overview.change-next-attendance.continue.get',
            {poolNumber: req.params.poolNumber})
        );
      }

      req.session.newAttendanceDate = req.body.attendanceDate;

      // TODO - send request to backend to either change next attendance date or put juror on call
      return res.redirect(app.namedRoutes.build('pool-overview.change-next-attendance.confirm.get',
        {poolNumber: req.params.poolNumber})
      );
    };
  };

  module.exports.getChangeAttendanceDateConfirm = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors)
        , poolNumber = req.params.poolNumber
        , attendanceDate = req.session.newAttendanceDate
        , jurorNumbers = req.session.selectedJurors;

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('pool-management/change-next-attendance-date/confirm-next-attendance-date', {
        processUrl: app.namedRoutes.build('pool-overview.change-next-attendance.confirm.post',
          {poolNumber: req.params.poolNumber}),
        cancelUrl: app.namedRoutes.build('pool-overview.get',
          { poolNumber: req.params.poolNumber }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('pool-overview.change-next-attendance.continue.get',
            {poolNumber: req.params.poolNumber}),
        },
        attendanceDate: dateFilter(attendanceDate, 'DD/MM/YYYY', 'dddd DD MMMM YYYY'),
        noJurors: jurorNumbers.length,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postChangeAttendanceDateConfirm = function(app) {
    return function(req, res) {
      const payload = _.clone(req.body);
      const jurors = _.clone(req.session.selectedJurors);
      const attendanceDate = _.clone(req.session.newAttendanceDate);

      delete req.session.selectedJurors;
      delete req.session.newAttendanceDate;

      payload.attendanceDate = attendanceDate;
      payload.jurors = jurors;

      req.session.bannerMessage = `${jurors.length} juror${jurors.length > 1 ? 's' : ''} 
        next due at court on ${dateFilter(attendanceDate, 'DD/MM/YYYY', 'dddd DD MMMM YYYY')}`;

      // TODO - send request to backend to either change next attendance date
      return res.redirect(app.namedRoutes.build('pool-overview.get', {poolNumber: req.params.poolNumber}));
    };
  };

})();
