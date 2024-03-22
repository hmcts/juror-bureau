(function() {
  'use strict';

  const _ = require('lodash');
  const {
    getApprovalExpenseListDAO,
    getEnteredExpensesDAO,
    postRecalculateSummaryTotalsDAO,
    editApprovalExpenseListDAO,
  } = require('../../../../objects/expense-record');
  const { defaultExpensesDAO } = require('../../../../objects/expenses');
  const { jurorDetailsObject } = require('../../../../objects/juror-record');
  const validate = require('validate.js');
  const enterExpensesValidator = require('../../../../config/validation/enter-expenses');
  const editApprovedExpensesValidator = require('../../../../config/validation/edit-approved-expenses');
  const { expenseRatesAndLimitsDAO } = require('../../../../objects/administration');
  const { getCourtLocationRates } = require('../../../../objects/court-location');

  const STATUSES = {
    'for-approval': 'FOR_APPROVAL',
    'for-reapproval': 'FOR_REAPPROVAL',
    'approved': 'APPROVED',
  };

  module.exports.getEditApprovalExpenses = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber, status } = req.params;
      const expenseDates = _.clone(req.session.editApprovalDates);
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      try {
        const requests = [];

        if (!req.session.editedExpenses) {
          req.session.editedExpenses = {};
        }

        const payload = {
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
          'expense_list': [],
        };

        for (const expenseDate of expenseDates) {
          if (req.session.editedExpenses[expenseDate]) {
            payload.expense_list.push(req.session.editedExpenses[expenseDate].formData);
          } else {
            payload.expense_list.push({
              'date_of_expense': expenseDate,
            });
          }
        }

        requests.push(postRecalculateSummaryTotalsDAO.post(app, req, payload));
        requests.push(defaultExpensesDAO.get(app, req, jurorNumber));
        requests.push(jurorDetailsObject.post(
          require('request-promise'),
          app,
          req.session.authToken,
          jurorNumber,
          null,
          ['NAME_DETAILS'],
        ));

        const [expensesData, defaultExpense, jurorDetails] = await Promise.all(requests);
        let originalExpenses, editedTotals;

        editedTotals = expensesData.total;

        // get the original values for showing comparison and make them {expenseDate: values}
        if (Object.keys(req.session.editedExpenses).length) {
          originalExpenses = await getApprovalExpenseListDAO.post(app, req, jurorNumber, poolNumber, expenseDates);

          originalExpenses = originalExpenses.expense_details.reduce((prev, originalExpense) => {
            if (req.session.editedExpenses[originalExpense.attendance_date]) {
              prev[originalExpense.attendance_date] = originalExpense;
            }

            return prev;
          }, {});
        }

        delete req.session.editExpenseTravelOverLimit;

        return res.render('expenses/edit/edit-approval-expenses-list.njk', {
          jurorNumber,
          poolNumber,
          status,
          expenseDates,
          defaultExpense,
          jurorDetails: jurorDetails[0],
          firstDay: expenseDates[0],
          lastDay: expenseDates[expenseDates.length - 1],
          expensesData,
          originalExpenses,
          total: editedTotals || originalExpenses.total,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to bundle and fetch expenses to edit', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            poolNumber,
            status,
            expenseDates,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error.code === 'EXPENSE_VALUES_REDUCED_LESS_THAN_PAID'){
          delete req.session.editedExpenses;
          req.session.errors = {
            noEditedExpenses: [{
              details: 'Default financial loss would bring value less than originally paid',
              summary: 'Default financial loss would bring value less than originally paid',
            }],
          };
          return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
            jurorNumber,
            poolNumber,
            status,
          }));
        }

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.postEditApprovalExpenses = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber, status } = req.params;
      const editedExpenses = _.clone(req.session.editedExpenses);

      if (!Object.keys(editedExpenses).length) {
        req.session.errors = {
          noEditedExpenses: [{
            details: 'Edit at least one expense before submitting',
            summary: 'Edit at least one expense before submitting',
          }],
        };

        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
          jurorNumber,
          poolNumber,
          status,
        }));
      }

      const expensesToPost = [];

      for (let expense of Object.values(editedExpenses)) {
        const _formData = expense.formData;

        _formData['pool_number'] = poolNumber;
        expensesToPost.push(_formData);
      }

      try {
        await editApprovalExpenseListDAO.post(app, req, jurorNumber, STATUSES[status], expensesToPost);

        delete req.session.editedExpenses;

        if (status === 'for-approval') {
          req.session.submitExpensesBanner = 'Expenses resubmitted for approval';
        }
        if (status === 'for-reapproval' || status === 'approved') {
          req.session.submitExpensesBanner = 'Expenses submitted for reapproval';
        }

        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          poolNumber,
          status,
        }));
      } catch (err) {
        app.logger.crit('Failed to update edited expenses', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            poolNumber,
            status,
            expensesToPost,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.getEditApprovalExpensesEdit = function(app) {
    return async function(req, res) {
      const { status, jurorNumber, poolNumber } = req.params;
      const { date, page } = req.query;
      const dates = req.session.editApprovalDates;
      const cancelUrl = app.namedRoutes.build('juror-management.edit-expense.get', {
        jurorNumber,
        poolNumber,
        status,
      });

      const pagination = {
        currPage: +page || 1,
        totalPages: req.session.editApprovalDates.length,
        prevLink: app.namedRoutes.build('juror-management.edit-expense.edit.get', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${dates[page - 2]}&page=${page - 1}`,
        nextLink: app.namedRoutes.build('juror-management.edit-expense.edit.get', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${dates[page]}&page=${+page + 1}`,
      };

      const postUrls = {
        saveAndNextUrl: app.namedRoutes.build('juror-management.edit-expense.edit.post', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${date}&page=${page}&action=next`,
        saveAndBackUrl: app.namedRoutes.build('juror-management.edit-expense.edit.post', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${date}&page=${page}&action=back`,
        applyToAllUrl: app.namedRoutes.build('juror-management.edit-expense.apply-to-all.post', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${date}&page=${page}`,
      };

      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      let payload;

      try {
        const requests = [];

        payload = {
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
          'expense_dates': [date],
        };

        requests.push(getEnteredExpensesDAO.post(app, req, payload));
        requests.push(jurorDetailsObject.post(
          require('request-promise'),
          app,
          req.session.authToken,
          jurorNumber,
          null,
          ['NAME_DETAILS'],
        ));

        let [[expensesData], jurorDetails] = await Promise.all(requests);

        if (req.session.editedExpenses[date]) {
          expensesData = _.merge(expensesData, req.session.editedExpenses[date].formData);
        }

        let tmpBody = manipulateExpensesApiData(expensesData, expensesData.none_attendance_day);
        const [hour, minute] = expensesData.time.time_spent_at_court.split(':');
        const timeSpentAtCourt = {
          hour,
          minute,
        };

        const template = expensesData.none_attendance_day
          ? 'expenses/enter-expenses-non-attendance.njk'
          : 'expenses/enter-expenses.njk';

        req.session.editForApprovalInNonAttendance = expensesData.none_attendance_day;

        // get the original values for a day and cache to compare if there are changes
        const originalTotals = await postRecalculateSummaryTotalsDAO.post(app, req, {
          'expense_list': [
            {
              'date_of_expense': date,
            },
          ],
          ...payload,
        });

        req.session.editOriginalValues = _.clone(expensesData);

        req.session.editDateTotalsOriginal = originalTotals.expense_details[0];

        if (req.session.editExpenseTravelOverLimit && req.session.editExpenseTravelOverLimit.body) {
          tmpBody = req.session.editExpenseTravelOverLimit.body;
        }

        delete req.session.editExpenseTravelOverLimit;

        return res.render(template, {
          jurorNumber,
          poolNumber,
          status,
          jurorDetails: jurorDetails[0],
          expensesData,
          tmpBody,
          pagination,
          timeSpentAtCourt,
          cancelUrl,
          postUrls,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch expense details to update', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            poolNumber,
            status,
            payload,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.postEditApprovalExpensesEdit = function(app) {
    return async function(req, res) {
      const { status, jurorNumber, poolNumber } = req.params;
      const { date, page, action, ['travel-over-limit']: travelOverLimit } = req.query;

      const nextDate = req.session.editApprovalDates[+page];

      const nonAttendanceDay = !!req.body.nonAttendance;
      let validatorResult;

      if (travelOverLimit === 'true') {
        req.body = req.session.editExpenseTravelOverLimit.body;
      }

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

        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.edit.get', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${date}&page=${page}`);
      }

      if (status === 'approved' || status === 'for-reapproval'){
        if (nonAttendanceDay) {
          validatorResult =
            validate(req.body, editApprovedExpensesValidator.nonAttendanceDay(req.session.editOriginalValues));
        } else {
          req.body.travelType =
          !Array.isArray(req.body.travelType) ? [req.body.travelType] : req.body.travelType;

          validatorResult =
            validate(req.body, editApprovedExpensesValidator.attendanceDay(req.session.editOriginalValues));
        }
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.tmpBody = req.body;

        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.edit.get', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${date}&page=${page}`);
      }

      const data = buildDataPayload(req.body, nonAttendanceDay);

      data['date_of_expense'] = date;
      data['none_attendance_day'] = nonAttendanceDay;

      if (!travelOverLimit) {
        const { showTravelOverLimit, error } = await isTravelOverLimit(app, req);

        req.session.editExpenseTravelOverLimit = {
          body: req.body,
        };

        if (error) {
          app.logger.crit('Failed to check if travel is over the limit', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber,
              poolNumber,
            },
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }

        if (showTravelOverLimit) {
          const cancelUrl = app.namedRoutes.build('juror-management.edit-expense.edit.get', {
            jurorNumber,
            poolNumber,
            status,
          }) + `?date=${date}&page=${page}`;
          let continueUrl = app.namedRoutes.build('juror-management.edit-expense.edit.post', {
            jurorNumber,
            poolNumber,
            status,
          }) + `?date=${date}&page=${page}&action=back&travel-over-limit=true`;

          if (action === 'next') {
            continueUrl = app.namedRoutes.build('juror-management.edit-expense.edit.post', {
              jurorNumber,
              poolNumber,
              status,
            }) + `?date=${date}&page=${page}&action=next&travel-over-limit=true`;
          }

          req.session.editExpenseTravelOverLimit.continueUrl = continueUrl;
          req.session.editExpenseTravelOverLimit.cancelUrl = cancelUrl;
          req.session.editExpenseTravelOverLimit.travelOverLimit = {
            ...showTravelOverLimit,
          };

          return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.travel-over-limit.get', {
            jurorNumber,
            poolNumber,
          }));
        }
      }

      // clear any data related to the edit expense travel over limit
      delete req.session.editExpenseTravelOverLimit;

      let response;

      try {
        response = await postRecalculateSummaryTotalsDAO.post(app, req, {
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
          'expense_list': [data],
        });

        // I want to compare the previous with this one to check
        const originalValues = _.clone(req.session.editDateTotalsOriginal);
        const responseValues = _.clone(response.expense_details[0]);

        delete originalValues.financial_loss_apportioned_applied;
        delete responseValues.financial_loss_apportioned_applied;

        if (JSON.stringify(originalValues) !== JSON.stringify(responseValues)) {
          req.session.editedExpenses[date] = {
            tableData: { ...response.expense_details[0] },
            formData: data,
          };
        } else {
          // if we somehow go back and reupdate to original data, just clear it :-)
          delete req.session.editedExpenses[date];
        }
      } catch (err) {
        app.logger.crit('Failed to recalculate the totals for an updated expense', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            data,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        req.session.errors = {
          updatedExpenses: [{
            summary: 'Failed to recalculate the totals for the last updated expense',
            details: 'Failed to recalculate the totals for the last updated expense',
          }],
        };

        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
          jurorNumber,
          poolNumber,
          status,
        }));
      }

      const { showLossOverLimit, error } =
        await isLossOverLimit(app, req, response.expense_details[0].attendance_type, date);

      if (error) {
        app.logger.crit('Failed to fetch default expenses to compare with', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: jurorNumber,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }

      // handle next url logic in the end
      let nextUrl;

      if (action === 'next') {
        nextUrl = app.namedRoutes.build('juror-management.edit-expense.edit.get', {
          jurorNumber,
          poolNumber,
          status,
        }) + `?date=${nextDate}&page=${+page + 1}`;
      }

      if (action === 'back' || !nextDate) {
        nextUrl = app.namedRoutes.build('juror-management.edit-expense.get', {
          jurorNumber,
          poolNumber,
          status,
        });
      }

      if (showLossOverLimit) {
        req.session.editExpenseLossOverLimitNextUrl = nextUrl;

        return res.redirect(app.namedRoutes.build('juror-management.enter-expenses.loss-over-limit.get', {
          jurorNumber,
          poolNumber,
        }));
      }

      return res.redirect(nextUrl);
    };
  };

  module.exports.postEditApprovalExpensesEditApplyToAll = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber, status } = req.params;
      const page = parseInt(req.query['page']) || 1;
      const date = req.query.date;
      const redirectUrl = app.namedRoutes.build('juror-management.edit-expense.edit.get', {
        jurorNumber,
        poolNumber,
        status,
      }) + `?date=${date}&page=${page}`;

      if (req.query.action === 'apply-default-loss') {
        try {
          const defaultExpenses = await defaultExpensesDAO.get(app, req, jurorNumber);

          req.body = {
            applyToAllDays: ['lossOfEarnings'],
            lossOfEarnings: defaultExpenses.financial_loss,
          };
        } catch (err) {
          app.logger.crit('Failed to fetch default expenses to add to all days', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: jurorNumber,
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
            jurorNumber,
            poolNumber,
            status,
          }));
        }
      }

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

      const applyToAllPayload = {};

      if (req.body.applyToAllDays.includes('lossOfEarnings')) {
        applyToAllPayload['financial_loss'] = {
          'loss_of_earnings': req.body.lossOfEarnings,
        };
      }

      if (req.body.applyToAllDays.includes('extraCareCosts')) {
        applyToAllPayload['financial_loss'] = {
          ...applyToAllPayload['financial_loss'],
          'extra_care_cost': req.body.extraCareCosts,
        };
      }

      if (req.body.applyToAllDays.includes('otherCosts')) {
        applyToAllPayload['financial_loss'] = {
          ...applyToAllPayload['financial_loss'],
          'other_cost': req.body.otherCosts,
        };
      }

      if (req.body.applyToAllDays.includes('travel')) {
        const data = buildDataPayload(req.body, false); // bit of a hack

        applyToAllPayload['travel'] = data.travel;
      }

      if (req.body.applyToAllDays.includes('paymentMethod')) {
        applyToAllPayload['pay_cash'] = req.body.paymentMethod === 'CASH';
      }

      let expensesData;

      try {
        expensesData = await getEnteredExpensesDAO.post(app, req, {
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
          'expense_dates': req.session.editApprovalDates,
        });

        const errors = {};

        for (const expense of expensesData) {
          if (req.body.applyToAllDays.includes('lossOfEarnings') && applyToAllPayload.financial_loss) {
            if (applyToAllPayload.financial_loss.loss_of_earnings
              // eslint-disable-next-line max-len
              && parseInt(applyToAllPayload.financial_loss.loss_of_earnings) < expense.financial_loss.loss_of_earnings) {
              errors.lossOfEarnings = [{
                summary: 'The new financial loss cannot be less than originally paid in the selected expenses',
                details: 'The new financial loss cannot be less than originally paid in the selected expenses',
              }];
            }
          }

          if (req.body.applyToAllDays.includes('extraCareCosts') && applyToAllPayload.financial_loss) {
            if (applyToAllPayload.financial_loss.extra_care_cost
              && parseInt(applyToAllPayload.financial_loss.extra_care_cost) < expense.financial_loss.extra_care_cost) {
              errors.extraCareCosts = [{
                summary: 'The new extra care costs cannot be less than originally paid in the selected expenses',
                details: 'The new extra care costs cannot be less than originally paid in the selected expenses',
              }];
            }
          }

          if (req.body.applyToAllDays.includes('otherCosts') && applyToAllPayload.financial_loss) {
            if (applyToAllPayload.financial_loss.other_cost
              && parseInt(applyToAllPayload.financial_loss.other_cost) < expense.financial_loss.other_cost) {
              errors.otherCosts = [{
                summary: 'The new other costs cannot be less than originally paid in the selected expenses',
                details: 'The new other costs cannot be less than originally paid in the selected expenses',
              }];
            }
          }

          if (req.body.applyToAllDays.includes('travel') && applyToAllPayload.travel) {
            if (applyToAllPayload.travel.miles_traveled
              && parseInt(applyToAllPayload.travel.miles_traveled) < expense.travel.miles_traveled) {
              errors.milesTravelled = [{
                summary: 'The new miles traveled cannot be less than originally paid in the selected expenses',
                details: 'The new miles traveled cannot be less than originally paid in the selected expenses',
              }];
            }

            if (applyToAllPayload.travel.parking
              && parseInt(applyToAllPayload.travel.parking) < expense.travel.parking) {
              errors.parking = [{
                summary: 'The new parking costs cannot be less than originally paid in the selected expenses',
                details: 'The new parking costs cannot be less than originally paid in the selected expenses',
              }];
            }

            if (applyToAllPayload.travel.public_transport
              && parseInt(applyToAllPayload.travel.public_transport) < expense.travel.public_transport) {
              errors.publicTransport = [{
                summary: 'The new public transport costs cannot be less than originally paid in the selected expenses',
                details: 'The new public transport costs cannot be less than originally paid in the selected expenses',
              }];
            }

            if (applyToAllPayload.travel.taxi
              && parseInt(applyToAllPayload.travel.taxi) < expense.travel.taxi) {
              errors.taxi = [{
                summary: 'The new taxi costs cannot be less than originally paid in the selected expenses',
                details: 'The new taxi costs cannot be less than originally paid in the selected expenses',
              }];
            }

            if (applyToAllPayload.travel.jurors_taken_by_car
              && parseInt(applyToAllPayload.travel.jurors_taken_by_car) < expense.travel.jurors_taken_by_car) {
              errors.passengers = [{
                summary: 'The new passengers taken cannot be less than originally paid in the selected expenses',
                details: 'The new passengers taken cannot be less than originally paid in the selected expenses',
              }];
            }
          }

          if (Object.entries(errors).length) {
            req.session.errors = errors;

            return res.redirect(redirectUrl);
          }
        }

        for (const expense of expensesData) {
          const expenseDate = expense.date_of_expense;
          let editedExpense = req.session.editedExpenses[expenseDate];

          if (!editedExpense) {
            req.session.editedExpenses[expenseDate] = {
              formData: { ..._.merge(expense, applyToAllPayload) },
            };
          } else {
            editedExpense.formData = {
              ..._.merge(editedExpense.formData, applyToAllPayload),
            };
          }
        }

        if (req.query.action === 'apply-default-loss') {
          return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
            jurorNumber,
            poolNumber,
            status,
          }));
        }

        return res.redirect(redirectUrl);
      } catch (err) {
        app.logger.crit('Failed to update all days expenses', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: expensesData,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  function buildDataPayload(body, nonAttendanceDay) {
    let data;

    if (nonAttendanceDay) {
      data = {
        'pay_cash': body.paymentMethod === 'CASH',
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
        'pay_cash': body.paymentMethod === 'CASH',
        time: {
          'pay_attendance': body.payAttendance,
          'travel_time': body['totalTravelTime-hour'] + ':' + body['totalTravelTime-minute'],
        },
        travel: {
          'traveled_by_car': false,
          'traveled_by_motorcycle': false,
          'traveled_by_bicycle': false,
          'jurors_taken_by_car': body.passengers,
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
    }

    if (body.travelType) {
      data.travel['traveled_by_car'] = body.travelType.includes('car');
      data.travel['traveled_by_motorcycle'] = body.travelType.includes('motorcycle');
      data.travel['traveled_by_bicycle'] = body.travelType.includes('bicycle');
    }

    return data;
  }

  function manipulateExpensesApiData(data, nonAttendanceDay) {
    let formData;

    if (nonAttendanceDay) {
      formData = {
        payAttendance: data.time.pay_attendance,
        lossOfEarnings: data.financial_loss.loss_of_earnings,
        extraCareCosts: data.financial_loss.extra_care_costs,
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
        passengers: data.travel.jurors_taken_by_car,
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

  async function isLossOverLimit(app, req, attendancType, date) {
    let showLossOverLimit;
    const totalFinancialLoss = Number(req.body.lossOfEarnings)
    + Number(req.body.extraCareCosts) + Number(req.body.otherCosts);
    let lossLimit;

    try {
      const { response } = await expenseRatesAndLimitsDAO.get(app, req);

      switch (attendancType) {
      case 'FULL_DAY':
        lossLimit = response.limit_financial_loss_full_day;
        break;
      case 'FULL_DAY_LONG_TRIAL':
        lossLimit = response.limit_financial_loss_full_day_long_trial;
        break;
      case 'HALF_DAY':
        lossLimit = response.limit_financial_loss_half_day;
        break;
      case 'HALF_DAY_LONG_TRIAL':
        lossLimit = response.limit_financial_loss_half_day_long_trial;
        break;
      case 'NON_ATTENDANCE':
        lossLimit = response.limit_financial_loss_full_day;
        break;
      case 'NON_ATTENDANCE_LONG_TRIAL':
        lossLimit = response.limit_financial_loss_full_day_long_trial;
        break;
      }

    } catch (error) {
      return { showLossOverLimit: false, error };
    }

    if (totalFinancialLoss > lossLimit) {
      showLossOverLimit = {
        'juror_loss': totalFinancialLoss,
        limit: lossLimit,
        'attendance_type': attendancType,
        'is_long_trial_day': false,
        // eslint-disable-next-line max-len
        message: `The amount you entered will automatically be recalculated to limit the juror's loss to £${lossLimit}`,
      };

      if (req.session.editedExpenses[date] && req.session.editedExpenses[date].formData) {
        req.session.editedExpenses[date].formData['financial_loss']['loss_of_earnings'] = lossLimit;
        req.session.editedExpenses[date].formData['financial_loss']['extra_care_cost'] = 0;
        req.session.editedExpenses[date].formData['financial_loss']['other_cost'] = 0;
      }

      req.session.financialLossWarning = showLossOverLimit;
    }

    return { showLossOverLimit, error: false };
  }

  async function isTravelOverLimit(app, req) {
    let showTravelOverLimit;

    try {
      const { publicTransport, taxi } = req.body;

      const {
        ['public_transport_soft_limit']: publicTransportLimit,
        ['taxi_soft_limit']: taxiLimit,
      } = await getCourtLocationRates(app, req);

      if (
        Number(publicTransportLimit) < Number(publicTransport)
        || Number(taxiLimit) < Number(taxi)
      ) {
        showTravelOverLimit = {
          publicTransportLimit,
          taxiLimit,
        };
      }

    } catch (error) {
      return { showTravelOverLimit, error };
    }

    return { showTravelOverLimit, error: false };
  }

})();
