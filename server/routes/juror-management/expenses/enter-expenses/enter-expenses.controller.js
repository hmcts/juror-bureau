(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const enterExpensesValidator = require('../../../../config/validation/enter-expenses');
  const {
    getEnteredExpensesDAO,
    postEditedExpensesDAO,
    postRecalculateSummaryTotalsDAO,
  } = require('../../../../objects/expense-record');
  const { getCourtLocationRates } = require('../../../../objects/court-location');
  const { jurorRecordDetailsDAO } = require('../../../../objects');

  module.exports.getEnterExpenses = (app) => {
    return async function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const { date } = req.query;
      const page = parseInt(req.query.page);

      // Some quick handler if there is no date in the query param
      if (!date || date === '' || !page) {
        return res.render('_errors/generic');
      }

      delete req.session.jurorsLoss;
      delete req.session.lossCap;
      delete req.session.currentExpensePage;
      delete req.session.nonAttendanceDay;

      const tmpErrors = _.cloneDeep(req.session.errors)
        , postUrls = {
          saveAndNextUrl: app.namedRoutes.build('juror-management.enter-expenses.post', {
            jurorNumber,
            locCode,
          }) + `?date=${date}&page=${page}&action=next`,
          saveAndBackUrl: app.namedRoutes.build('juror-management.enter-expenses.post', {
            jurorNumber,
            locCode,
          }) + `?date=${date}&page=${page}&action=back`,
          applyToAllUrl: app.namedRoutes.build('juror-management.enter-expenses.apply-to-all.post', {
            jurorNumber,
            locCode,
          }) + `?date=${date}&page=${page}`,
        }
        , cancelUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: 'draft',
        });
      let tmpBody, responses;

      try {
        const _expensesData = getEnteredExpensesDAO.post(app, req, locCode, jurorNumber, {
          'expense_dates': [date],
        });

        const _jurorDetails = jurorRecordDetailsDAO.post(req, [{
          'juror_number': jurorNumber,
          'juror_version': null,
          'include': ['NAME_DETAILS'],
        }]);

        responses = await Promise.all([_expensesData, _jurorDetails]);

        app.logger.info('Fetched expenses data and juror details for', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            locCode,
            attendanceDate: date,
          },
        });

      } catch (err) {
        app.logger.crit('Failed to fetch draft expense for: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            locCode,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }

      const expensesData = responses[0][0];
      const jurorDetails = responses[1]['0'];

      // Mimicing paginating the list, returning same header data but expenses list will be filtered to 1
      const pagination = buildExpensesPagination(app, req, res, page);

      const renderTemplate = expensesData.none_attendance_day
        ? 'expenses/enter-expenses-non-attendance.njk'
        : 'expenses/enter-expenses.njk';

      req.session.nonAttendanceDay = expensesData.none_attendance_day;

      if (!req.session.tmpBody) {
        tmpBody = manipulateExpensesApiData(expensesData);
      } else {
        tmpBody = _.cloneDeep(req.session.tmpBody);
      }

      delete req.session.errors;
      delete req.session.tmpBody;
      delete req.session.lowerLossCap;

      const [timeSpentAtCourtHour, timeSpentAtCourtMinute] = expensesData.time.time_spent_at_court.split(':');

      if (req.session.editExpenseTravelOverLimit && req.session.editExpenseTravelOverLimit[date] && req.session.editExpenseTravelOverLimit[date].body) {
        tmpBody = req.session.editExpenseTravelOverLimit[date].body;
      }

      return res.render(renderTemplate, {
        postUrls,
        cancelUrl,
        pagination,
        expensesData,
        jurorDetails,
        timeSpentAtCourt: {
          hour: timeSpentAtCourtHour,
          minute: timeSpentAtCourtMinute,
        },
        jurorNumber,
        locCode,
        status: 'draft',
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
    return async function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const { date, action, ['travel-over-limit']: travelOverLimit } = req.query;
      const page = parseInt(req.query['page']);
      const nonAttendanceDay = _.clone(req.session.nonAttendanceDay);
      const nextDate = req.session.expensesData.dates[page];
      const nextPage = page + 1;
      let validatorResult;

      delete req.session.nonAttendanceDay;

      if (travelOverLimit === 'true') {
        req.body = req.session.editExpenseTravelOverLimit[date].body;
      }

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
          jurorNumber,
          locCode,
        }) + `?date=${date}&page=${page}`);
      }

      const data = buildDataPayload(req.body, nonAttendanceDay);

      data['date_of_expense'] = date;

      if (!travelOverLimit) {
        const { showTravelOverLimit, error } = await isTravelOverLimit(app, req);

        if (req.session.editExpenseTravelOverLimit) {
          req.session.editExpenseTravelOverLimit[date] = {
            body: req.body,
          };
        } else {
          req.session.editExpenseTravelOverLimit = {};
          req.session.editExpenseTravelOverLimit[date] = {
            body: req.body,
          }
        }

        if (error) {
          app.logger.crit('Failed to check if travel is over the limit', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber,
              locCode,
            },
            error: typeof error.error !== 'undefined' ? error.error : error.toString(),
          });

          return res.render('_errors/generic');
        }

        if (showTravelOverLimit) {
          const cancelUrl = app.namedRoutes.build('juror-management.enter-expenses.get', {
            jurorNumber,
            locCode,
          }) + `?date=${date}&page=${page}`;
          let continueUrl = app.namedRoutes.build('juror-management.enter-expenses.post', {
            jurorNumber,
            locCode,
          }) + `?date=${date}&page=${page}&action=back&travel-over-limit=true`;

          if (action === 'next' && nextDate) {
            continueUrl = app.namedRoutes.build('juror-management.enter-expenses.post', {
              jurorNumber,
              locCode,
            }) + `?date=${date}&page=${page}&action=next&travel-over-limit=true`;
          }

          req.session.editExpenseTravelOverLimit[date].continueUrl = continueUrl;
          req.session.editExpenseTravelOverLimit[date].cancelUrl = cancelUrl;
          req.session.editExpenseTravelOverLimit[date].travelOverLimit = {
            ...showTravelOverLimit,
          };

          return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.travel-over-limit.get', {
            jurorNumber,
            locCode,
          }) + '?date=' + date);
        }
      }

      try {
        const payload = {
          'expense_list': [{ ...data }],
        };

        await postRecalculateSummaryTotalsDAO.post(app, req, locCode, jurorNumber, payload);
      } catch (err) {
        if (err.error && err.error.code === 'EXPENSES_CANNOT_BE_LESS_THAN_ZERO') {
          req.session.tmpBody = {
            ...req.body,
            date,
            page,
          };

          return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.total-less-zero.get', {
            jurorNumber,
            locCode,
          }));
        }
      }

      try {
        const { '0': response } = await postEditedExpensesDAO.put(req, locCode, jurorNumber, 'DRAFT', [data]);

        if (response.financial_loss_warning) {
          req.session.financialLossWarning = response.financial_loss_warning;

          req.session.nextExpensePage = action === 'next' ? nextPage : false;
          req.session.nextExpenseDate = action === 'next' ? nextDate : false;

          return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.loss-over-limit.get', {
            jurorNumber,
            locCode,
          }));
        }

        if (action === 'next' && nextDate) {
          return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.get', {
            jurorNumber,
            locCode,
          }) + `?date=${nextDate}&page=${nextPage}`);
        }

        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: 'draft',
        }));
      } catch (err) {
        app.logger.crit('Failed to update a draft expense: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            ...data,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.getLossOverLimit = (app) => {
    return function(req, res) {
      const { jurorNumber, locCode } = req.params;

      return res.render('expenses/loss-over-limit.njk', {
        jurorLossData: req.session.financialLossWarning,
        processUrl: app.namedRoutes.build('juror-management.enter-expenses.loss-over-limit.post', {
          jurorNumber,
          locCode,
        }),
      });
    };
  };

  module.exports.postLossOverLimit = (app) => {
    return function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const date = req.session.nextExpenseDate;
      const page = req.session.nextExpensePage;

      delete req.session.financialLossWarning;
      delete req.session.nextExpensePage;
      delete req.session.nextExpenseDate;

      if (req.session.editExpenseLossOverLimitNextUrl) {
        const nextUrl = req.session.editExpenseLossOverLimitNextUrl;

        delete req.session.editExpenseLossOverLimitNextUrl;

        return res.redirect(nextUrl);
      }

      if (date && page) {
        return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber,
          locCode,
        }) + `?date=${date}&page=${page}`);
      }

      return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
        jurorNumber,
        locCode,
        status: 'draft',
      }));
    };
  };

  module.exports.getTravelOverLimit = (app) => {
    return async function(req, res) {
      const { date } = req.query;
      if (!req.session.editExpenseTravelOverLimit || !req.session.editExpenseTravelOverLimit[date]) {
        app.logger.crit('Tried to navigate back to loss-over-limit page without the session data', {
          auth: req.session.authentication,
        });

        return res.render('_errors/generic');
      }

      const { continueUrl, cancelUrl, travelOverLimit, body } = req.session.editExpenseTravelOverLimit[date];

      return res.render('expenses/travel-over-limit.njk', {
        continueUrl,
        cancelUrl,
        travelOverLimit,
        body,
      });
    };
  };

  module.exports.postApplyExpensesToAll = (app) => {
    return async function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const page = parseInt(req.query['page']) || 1;
      const date = req.query.date;
      const redirectUrl = app.namedRoutes.build('juror-management.enter-expenses.get', {
        jurorNumber,
        locCode,
      }) + `?date=${date}&page=${page}`;

      if (!req.body.applyToAllDays) {
        req.session.errors = {
          applyToAllDays: [{
            summary: 'Select at least one option to copy and apply',
            details: 'Select at least one option to copy and apply',
          }],
        };

        req.session.tmpBody = req.body;

        return res.redirect(redirectUrl);
      }

      const data = buildDataPayload(req.body, req.session.nonAttendanceDay);

      data['date_of_expense'] = date;
      data['apply_to_days'] = [];

      if (req.body.applyToAllDays.includes('lossOfEarnings')) {
        data.apply_to_days.push('LOSS_OF_EARNINGS');
      }
      if (req.body.applyToAllDays.includes('extraCareCosts')) {
        data.apply_to_days.push('EXTRA_CARE_COSTS');
      }
      if (req.body.applyToAllDays.includes('otherCosts')) {
        data.apply_to_days.push('OTHER_COSTS');
      }
      if (req.body.applyToAllDays.includes('travel')) {
        data.apply_to_days.push('TRAVEL_COSTS');
      }
      if (req.body.applyToAllDays.includes('paymentMethod')) {
        data.apply_to_days.push('PAY_CASH');
      }

      try {
        await postEditedExpensesDAO.put(req, locCode, jurorNumber, 'DRAFT', [data]);

        return res.redirect(redirectUrl);
      } catch (err) {
        app.logger.crit('Failed to update expenses for all draft days: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            ...data,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.getTotalLessThanZero = (app) => {
    return function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const { date, page } = req.session.tmpBody;

      return res.render('expenses/total-less-than-zero.njk', {
        defaultExpensesUrl: app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber,
          locCode,
        }),
        cancelUrl: app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber,
          locCode,
        }) + `?date=${date}&page=${page}`,
      });
    };
  };

  module.exports.getRecalculateTotals = (app) => {
    return async function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const { status } = req.query;

      delete req.body._csrf;

      const data = {
        'expense_list': [
          req.body,
        ],
      };

      try {
        const response = await postRecalculateSummaryTotalsDAO.post(app, req, locCode, jurorNumber, data);

        app.logger.info('Recalculated summary totals for: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            locCode,
          },
        });

        return res.render('expenses/_partials/summary.njk', {
          expenseData: response.expense_details[0],
          expenseTotals: response.totals,
          status,
        });
      } catch (err) {
        app.logger.crit('Failed to recalculate the summary totals: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('expenses/_partials/recalculate-error-banner.njk', {
          isLessThanPaid: err.error && err.error.code === 'EXPENSE_VALUES_REDUCED_LESS_THAN_PAID',
          isLessThanZero: err.error && err.error.code === 'EXPENSES_CANNOT_BE_LESS_THAN_ZERO'
        });
      }
    };
  };

  function buildExpensesPagination(app, req, res, page) {
    let pagination = {
      currPage: page,
      totalPages: req.session.expensesData.total,
    };

    delete req.session.totalPages;

    req.session.totalPages = pagination.totalPages;

    const nextDate = req.session.expensesData.dates[page];
    const prevDate = req.session.expensesData.dates[page - 2];

    if (req.session.expensesData.total > 1) {
      if (page !== 1) {
        pagination.prevLink = app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          locCode: req.params.locCode,
        }) + `?date=${prevDate}&page=${page - 1}`;
      }
      if (page !== req.session.expensesData.total) {
        pagination.nextLink = app.namedRoutes.build('juror-management.enter-expenses.get', {
          jurorNumber: req.params.jurorNumber,
          locCode: req.params.locCode,
        }) + `?date=${nextDate}&page=${page + 1}`;
      }
    }

    return pagination;
  }

  function buildDataPayload(body, nonAttendanceDay) {
    let data = {};

    if (nonAttendanceDay) {
      data = {
        'payment_method': body.paymentMethod,
        'time': {
          'pay_attendance': body.payAttendance,
        },
        'financial_loss': {
          'loss_of_earnings': body.lossOfEarnings,
          'extra_care_cost': body.extraCareCosts,
          'other_cost': body.otherCosts,
          'other_cost_description': body.otherCostsDescription,
        },
      };
    } else {
      data = {
        'payment_method': body.paymentMethod,
        time: {
          'pay_attendance': body.payAttendance,
          'travel_time': body['totalTravelTime-hour'].padStart(2, '0')
            + ':' + body['totalTravelTime-minute'].padStart(2, '0'),
        },
        travel: {
          'traveled_by_car': false,
          'traveled_by_motorcycle': false,
          'traveled_by_bicycle': false,
          'jurors_taken_by_car': body.carPassengers,
          'jurors_taken_by_motorcycle': body.motoPassengers,
          'miles_traveled': body.milesTravelled,
          parking: body.parking,
          'public_transport': body.publicTransport,
          taxi: body.taxi,
        },
        'food_and_drink': {
          'food_and_drink_claim_type': body.foodAndDrink,
          'smart_card_amount': body.smartcardSpend,
        },
        'financial_loss': {
          'loss_of_earnings': body.lossOfEarnings,
          'extra_care_cost': body.extraCareCosts,
          'other_cost': body.otherCosts,
          'other_cost_description': body.otherCostsDescription,
        },
      };

      if (body.travelType) {
        data.travel['traveled_by_car'] = body.travelType.includes('car');
        data.travel['traveled_by_motorcycle'] = body.travelType.includes('motorcycle');
        data.travel['traveled_by_bicycle'] = body.travelType.includes('bicycle');
      }
    }

    return data;
  }

  function manipulateExpensesApiData(data) {
    let formData;

    if (data.attendance_type === 'NON_ATTENDANCE') {
      formData = {
        payAttendance: data.time.pay_attendance,
        lossOfEarnings: data.financial_loss.loss_of_earnings,
        extraCareCosts: data.financial_loss.extra_care_cost,
        otherCosts: data.financial_loss.other_cost,
        otherCostsDescription: data.financial_loss.other_cost_description,
      };
    } else {
      const [totalTravelTimeHour, totalTravelTimeMinute] = data.time.travel_time.split(':');

      formData = {
        'totalTravelTime-hour': totalTravelTimeHour,
        'totalTravelTime-minute': totalTravelTimeMinute,
        payAttendance: data.time.pay_attendance,
        travelType: data.travelType,
        carPassengers: data.travel.jurors_taken_by_car,
        motoPassengers: data.travel.jurors_taken_by_motorcycle,
        milesTravelled: data.travel.miles_traveled,
        parking: data.travel.parking,
        publicTransport: data.travel.public_transport,
        taxi: data.travel.taxi,
        lossOfEarnings: data.financial_loss.loss_of_earnings,
        extraCareCosts: data.financial_loss.extra_care_cost,
        otherCosts: data.financial_loss.other_cost,
        otherCostsDescription: data.financial_loss.other_cost_description,
        smartcardSpend: data.food_and_drink.smart_card_amount,
      };
    }

    return formData;
  }

  async function isTravelOverLimit(app, req) {
    let showTravelOverLimit;

    try {
      const { publicTransport, taxi } = req.body;
      const response = await getCourtLocationRates(app, req);

      const publicTransportLimit = response.public_transport_soft_limit;
      const taxiLimit = response.taxi_soft_limit;

      if (!publicTransportLimit && !taxiLimit) {
        return { showTravelOverLimit, error: false };
      }

      if (
        (publicTransportLimit && (Number(publicTransportLimit) < Number(publicTransport)))
        || (taxiLimit && (Number(taxiLimit) < Number(taxi)))
      ) {
        showTravelOverLimit = {
          publicTransportLimit: response.public_transport_soft_limit,
          taxiLimit: response.taxi_soft_limit,
        };
      }

    } catch (error) {
      return { showTravelOverLimit, error };
    }

    return { showTravelOverLimit, error: false };
  }

})();
