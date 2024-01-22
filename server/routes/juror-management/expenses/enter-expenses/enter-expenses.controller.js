(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , enterExpensesValidator = require('../../../../config/validation/enter-expenses');

  const stubbedExpenseEntries = require('../../../../stores/daily-expenses-entry');

  module.exports.getEnterExpenses = (app) => {
    return function(req, res) {
      delete req.session.jurorsLoss;
      delete req.session.lossCap;
      delete req.session.currentExpensePage;
      delete req.session.nonAttendanceDay;

      const tmpErrors = _.cloneDeep(req.session.errors)
        , page = parseInt(req.query['page']) || 1
        , postUrls = {
          saveAndNextUrl: app.namedRoutes.build('juror-management.enter-expenses.post', {
            jurorNumber: req.params.jurorNumber,
            poolNumber: req.params.poolNumber,
          }) + '?page=' + page + '&action=next',
          saveAndBackUrl: app.namedRoutes.build('juror-management.enter-expenses.post', {
            jurorNumber: req.params.jurorNumber,
            poolNumber: req.params.poolNumber,
          }) + '?page=' + page + '&action=back',
          applyToAllUrl: app.namedRoutes.build('juror-management.enter-expenses.apply-to-all.post', {
            jurorNumber: req.params.jurorNumber,
            poolNumber: req.params.poolNumber,
          }) + '?page=' + page,
        }
        , changeFoodUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber: req.params.jurorNumber,
        })
        , cancelUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        });
      let tmpBody;

      // TODO - calculation rates will come from backend
      const calculationsData = {
        fullDayLossCap: 64.95,
        halfDayLossCap: 32.50,
        foodAndDrinkDefault: 5.71,
        carRateDefault: 0.35,
        carRateOnePassenger: 0.5,
        carRateTwoPassengers: 0.75,
        motorcycleRate: 0.23,
        bicycleRate: 0.1,
      };

      // Mimicing paginating the list, returning same header data but expenses list will be filtered to 1
      const pagination = buildExpensesPagination(app, req, res, page)
        , dailyExpenseData = _.clone(stubbedExpenseEntries)
        , dailyExpenses = dailyExpenseData.expenses[page - 1];

      dailyExpenseData.expenses = [dailyExpenses];

      const renderTemplate = dailyExpenseData.expenses[0].timeAtCourt === 'non-attendance'
        ? 'expenses/enter-expenses-non-attendance.njk'
        : 'expenses/enter-expenses.njk';

      req.session.nonAttendanceDay = dailyExpenseData.expenses[0].timeAtCourt === 'non-attendance';

      if (!req.session.tmpBody) {
        // TODO - replace with API call
        tmpBody = manipulateExpesnesApiData(dailyExpenseData.expenses[0]);
      } else {
        tmpBody = _.cloneDeep(req.session.tmpBody);
      }

      if (req.session.lowerLossCap){
        tmpBody.lossOfEarnings = _.clone(req.session.lowerLossCap);
        tmpBody.extraCareCosts = '';
        tmpBody.otherCosts = '';
        tmpBody.otherCostsDescription = '';
      }

      delete req.session.errors;
      delete req.session.tmpBody;
      delete req.session.lowerLossCap;

      return res.render(renderTemplate, {
        postUrls,
        changeFoodUrl,
        cancelUrl,
        pagination,
        data: dailyExpenseData,
        // Data needed to do totals calculations in FE
        calculationsData,
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postEnterExpenses = (app) => {
    return function(req, res) {
      const page = parseInt(req.query['page']) || 1
        , action = req.query['action']
        , nonAttendanceDay = _.clone(req.session.nonAttendanceDay);
      let validatorResult;

      delete req.session.nonAttendanceDay;

      req.body.applyToAllDays =
        !Array.isArray(req.body.applyToAllDays) ? [req.body.applyToAllDays] : req.body.applyToAllDays;

      if (nonAttendanceDay) {
        validatorResult = validate(req.body, enterExpensesValidator.nonAttendanceDay());
      } else {
        req.body.travelType =
        !Array.isArray(req.body.travelType) ? [req.body.travelType] : req.body.travelType;

        validatorResult = validate(req.body, enterExpensesValidator.attendanceDay());
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.tmpBody = req.body;
        return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }) + '?page=' + page);
      }

      const lossOfEarnings = parseFloat(req.body.lossOfEarnings) || 0;
      const extraCareCosts = parseFloat(req.body.extraCareCosts) || 0;
      const otherCosts = parseFloat(req.body.otherCosts) || 0;
      const totalLoss = lossOfEarnings + extraCareCosts + otherCosts;
      const lossCap = req.body.payAttendance === 'fullDay' ? 64.95 : 32.50;

      if (totalLoss > lossCap) {
        req.session.tmpBody = req.body;
        req.session.jurorsLoss = totalLoss;
        req.session.lossCap = {
          attendance: req.body.payAttendance,
          total: lossCap.toFixed(2),
        };
        req.session.currentExpensePage = page;
        return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.loss-over-limit.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }));
      }

      if (parseFloat(req.body.total) < 0){
        req.session.tmpBody = req.body;
        return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.total-less-zero.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }));
      }

      if (action === 'next') {
        const nextPage = req.session.totalPages !== page ? page + 1 : page;

        return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
        }) + '?page=' + nextPage);
      }
      return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
        jurorNumber: req.params.jurorNumber,
        poolNumber: req.params.poolNumber,
      }));
    };
  };

  module.exports.getLossOverLimit = (app) => {
    return function(req, res) {
      const jurorsLoss = _.clone(req.session.jurorsLoss)
        , lossCap = _.clone(req.session.lossCap);

      return res.render('expenses/loss-over-limit.njk', {
        jurorsLoss: jurorsLoss,
        lossCap: lossCap,
        processUrl: app.namedRoutes.build('juror-management.enter-expenses.loss-over-limit.post', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }),
      });
    };
  };

  module.exports.postLossOverLimit = (app) => {
    return function(req, res) {
      const page = req.session.currentExpensePage;

      req.session.lowerLossCap = _.clone(req.session.lossCap.total);

      delete req.session.jurorsLoss;
      delete req.session.lossCap;
      delete req.session.currentExpensePage;

      return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.get', {
        jurorNumber: req.params.jurorNumber,
        poolNumber: req.params.poolNumber,
      }) + '?page=' + page);
    };
  };

  module.exports.postApplyExpensesToAll = (app) => {
    return function(req, res) {
      const page = parseInt(req.query['page']) || 1;

      if (!req.body.applyToAllDays) {
        req.session.errors = {
          applyToAllDays: [{
            summary: 'Select at least one option to copy and apply',
            details: 'Select at least one option to copy and apply',
          }],
        };
        req.session.tmpBody = req.body;
        return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }) + '?page=' + page);
      }

      // TODO add call to BE once ready

      return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.get', {
        jurorNumber: req.params.jurorNumber,
        poolNumber: req.params.poolNumber,
      }) + '?page=' + page);
    };
  };

  module.exports.getTotalLessThanZero = (app) => {
    return function(req, res) {
      return res.render('expenses/total-less-than-zero.njk', {
        deaultExpensesUrl: app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }),
        cancelUrl: app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }),
      });
    };
  };

  function buildExpensesPagination(app, req, res, page) {
    let pagination = {
      currPage: page,
      totalPages: stubbedExpenseEntries.totalDays,
    };

    delete req.session.totalPages;

    req.session.totalPages = pagination.totalPages;

    if (stubbedExpenseEntries.totalDays > 1) {
      if (page !== 1) {
        pagination.prevLink = app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }) + '?page=' + (page - 1);
      }
      if (page !== stubbedExpenseEntries.totalDays) {
        pagination.nextLink = app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }) + '?page=' + (page + 1);
      }
    }

    return pagination;
  }

  // Matches data from api to correct form fields
  // TODO - update once BE has been implemented
  function manipulateExpesnesApiData(data) {
    let formData;

    if (data.timeAtCourt === 'non-attendance') {
      formData = {
        payAttendance: data.payAttendance,
        lossOfEarnings: data.lossOfEarnings,
        extraCareCosts: data.extraCareCosts,
        otherCosts: data.otherCosts,
        otherCostsDescription: data.otherCostsDescription,
      };
    } else {
      formData = {
        'totalTravelTime-hour': data.travelTime.hour,
        'totalTravelTime-minute': data.travelTime.minute,
        payAttendance: data.payAttendance,
        travelType: data.travelType,
        passengers: data.passengers,
        milesTravelled: data.milesTravelled,
        parking: data.parking,
        publicTransport: data.publicTransport,
        taxi: data.taxi,
        lossOfEarnings: data.lossOfEarnings,
        extraCareCosts: data.extraCareCosts,
        otherCosts: data.otherCosts,
        otherCostsDescription: data.otherCostsDescription,
        smartcardSpend: data.smartcardSpend,
      };
    }

    return formData;
  }

})();
