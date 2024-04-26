(function() {
  'use strict';

  const _ = require('lodash');
  const { dateFilter, capitalizeFully, makeDate } = require('../../../components/filters');
  const { isCourtUser } = require('../../../components/auth/user-type');
  const jurorRecordObject = require('../../../objects/juror-record');
  const validate = require('validate.js');
  const modUtils = require('../../../lib/mod-utils');
  const { defaultExpensesDAO, jurorBankDetailsDAO } = require('../../../objects/expenses');
  const { systemCodesDAO, expensesSummaryDAO } = require('../../../objects');

  // TODO: this will probably be removed when we move to a single juror / summons record
  module.exports.checkResponse = function(app) {
    return async function(req, res, next) {
      const digitalResponseObj = require('../../../objects/response-detail').object
        , paperResponseObj = require('../../../objects/paper-reply').paperReplyObject;

      delete req.session.hasSummonsResponse;

      const digitalResponse = digitalResponseObj.get(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['jurorNumber'],
          req.session.hasModAccess,
        ),
        paperResponse = paperResponseObj.get(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['jurorNumber'],
        );

      Promise.allSettled([digitalResponse, paperResponse])
        .then(([digital, paper]) => {
          if (digital.value && digital.value.dateReceived && digital.value.dateReceived !== 'Invalid date') {

            app.logger.debug('This juror already responded via the public portal', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                jurorNumber: req.params['jurorNumber'],
                type: 'digital',
              },
            });

            req.session.summonsReplyStatus = digital.value.processingStatus;
            req.session.hasSummonsResponse = true;
          }

          if (paper.value && paper.value.data.dateReceived) {

            app.logger.debug('This juror already responded via paper', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                jurorNumber: req.params['jurorNumber'],
                type: 'paper',
              },
            });

            req.session.summonsReplyStatus = paper.value.data.processingStatus;
            req.session.hasSummonsResponse = true;
          }

          next();
        })
        .catch(() => next());
    };
  };

  // when accessing a tab (any tab) if the juror record does not exist the api will return a 404
  // this 404 needs to be handled on a different way to all other error codes... it should show a juror-not-found page
  // bureau and courts have access to different jurors so what sends a 404 for one will send a 200 valid juror response

  module.exports.getDetailsTab = function(app) {
    return function(req, res) {
      var successCB = function(response) {

          app.logger.info('Fetched the juror record details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              response: response.data,
            },
          });

          if (typeof response.data === 'undefined') {
            return res.render('_errors/not-found');
          }

          cacheJurorCommonDetails(req, response.data.commonDetails);

          // TODO: handle the backLink
          return res.render('juror-management/juror-record/details', {
            backLinkUrl: 'homepage.get',
            juror: response.data,
            currentTab: 'details',
            jurorStatus: resolveJurorStatus(response.data.commonDetails),
            hasSummons: req.session.hasSummonsResponse,
            summonsReplyStatus: req.session.summonsReplyStatus,
            isCourtUser: isCourtUser(req),
          });
        }
        , errorCB = function(err) {
          if (err.statusCode === 404) {
            return res.render('juror-management/_errors/not-found');
          }

          app.logger.crit('Failed to fetch juror record details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              locationCode: req.session.locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      clearInvalidSessionData(req);

      jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'detail',
        req.params['jurorNumber'],
        req.session.locCode,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getOverviewTab = function(app) {
    return function(req, res) {
      var successCB = async function([overview, detail]) {
          var availableMessage = false
            , bannerMessage
            , canSummon = true
            , jurorStatus = resolveJurorStatus(overview.data.commonDetails);

          app.logger.info('Fetched the juror record overview: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              response: overview.data,
            },
          });

          if (typeof overview.data === 'undefined') {
            return res.render('_errors/generic');
          }

          if (req.session.bannerMessage) {
            availableMessage = true;
          }

          bannerMessage = req.session.bannerMessage;
          delete req.session.bannerMessage;

          req.session.jurorUpdate = {
            poolNumber: overview.data.commonDetails.poolNumber,
            currentAttendanceDate: overview.data.commonDetails.startDate,
          };
          cacheJurorCommonDetails(req, overview.data.commonDetails);

          const poolDetails = buildPooldetailsRows(app.namedRoutes, overview.data.commonDetails);

          if (overview.data.commonDetails.owner !== '400' && !isCourtUser(req)) {
            canSummon = false;
          };

          switch (jurorStatus) {
          case 'Undeliverable':
          case 'Responded':
          case 'Completed':
          case 'Disqualified':
            canSummon = false;
            break;
          };

          req.session.jurorNameChangeAttendance = overview.data.commonDetails.firstName
          + ' ' + overview.data.commonDetails.lastName;

          let canRunPoliceCheck = true;

          if ((detail.data.addressLineOne === '' || detail.data.addressLineOne === null)
          || (detail.data.addressTown === '' || detail.data.addressTown === null)
          || (detail.data.addressPostcode === '' || detail.data.addressPostcode === null)) {
            canRunPoliceCheck = false;
          }

          const idCheckDescription = await resolveIdCheckDescription(app, req, overview.data.idCheckCode);

          // TODO: handle the backLink
          return res.render('juror-management/juror-record/overview', {
            backLinkUrl: 'homepage.get',
            juror: overview.data,
            canSummon,
            currentTab: 'overview',
            jurorStatus,
            canRunPoliceCheck,
            policeCheck: resolvePoliceCheckStatus(req, overview.data.commonDetails.police_check),
            bannerMessage: bannerMessage,
            availableMessage: availableMessage,
            hasSummons: req.session.hasSummonsResponse,
            poolDetails,
            idCheckDescription,
            // Next service date attributes are hardcoded and
            // hidden behind a specific query param until backend for this data has been implemented
            showServiceAttributes: req.query.serviceAttributes,
          });
        }
        , errorCB = function(err) {
          if (err.statusCode === 404) {
            return res.render('juror-management/_errors/not-found');
          }

          app.logger.crit('Failed to fetch juror record details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              locationCode: req.session.locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      clearInvalidSessionData(req);

      const promiseArr = [];

      if (req.query.loc_code) {
        req.session.locCode = req.query.loc_code;
      }

      promiseArr.push(jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'overview',
        req.params['jurorNumber'],
        req.session.locCode,
      ));

      promiseArr.push(jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'detail',
        req.params['jurorNumber'],
        req.session.locCode,
      ));

      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getSummonsTab = function(app) {
    return function(req, res) {
      var successCB = function(response) {

          app.logger.info('Fetched the juror record summons reply info: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              response: response.data,
            },
          });

          if (typeof response.data === 'undefined') {
            return res.render('juror-management/_errors/not-found');
          }

          cacheJurorCommonDetails(req, response.data.commonDetails);

          return res.render('juror-management/juror-record/summons', {
            backLinkUrl: 'homepage.get',
            currentTab: 'summons',
            juror: response.data,
            jurorStatus: resolveJurorStatus(response.data.commonDetails),
            replyStatus: modUtils.resolveReplyStatus(response.data.replyStatus),
            processingOutcome: modUtils.resolveProcessingOutcome(response.data.commonDetails.jurorStatus,
              response.data.commonDetails.excusalRejected, response.data.commonDetails.excusalDescription),
            hasSummons: req.session.hasSummonsResponse,
          });
        }
        , errorCB = function(err) {
          if (err.statusCode === 404) {
            return res.render('juror-management/_errors/not-found');
          }

          app.logger.crit('Failed to fetch the juror summons data: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              locationCode: req.session.locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      clearInvalidSessionData(req);

      jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'summons-reply',
        req.params['jurorNumber'],
        req.session.locCode,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getExpensesTab = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;

      try {
        clearInvalidSessionData(req);

        // TODO - Make call to relevant API once available
        const jurorOverview = await jurorRecordObject.record.get(
          require('request-promise'),
          app,
          req.session.authToken,
          'overview',
          jurorNumber,
          req.session.locCode,
        );

        cacheJurorCommonDetails(req, jurorOverview.data.commonDetails);

        const locCode = req.session.authentication.locCode;
        const defaultExpenses = await defaultExpensesDAO.get(app, req, locCode, jurorNumber);
        const { response: bankDetails } = await jurorBankDetailsDAO.get(app, req, jurorNumber);
        const viewAllExpensesLink = app.namedRoutes.build('juror-management.unpaid-attendance.get');
        const viewDraftExpensesLink = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber, locCode, status: 'draft',
        });
        // eslint-disable-next-line max-len
        const viewForApprovalExpensesLink = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber, locCode, status: 'for-approval',
        });
        // eslint-disable-next-line max-len
        const viewApprovedExpensesLink = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber, locCode, status: 'approved',
        });
        const editDefaultExpensesLink = app.namedRoutes.build('juror-record.default-expenses.get', {
          jurorNumber,
        });
        const editBankDetailsLink = app.namedRoutes.build('juror-record.bank-details.get', {
          jurorNumber,
        });

        try {
          const expensesSummary = await expensesSummaryDAO.get(req, jurorNumber, locCode);

          app.logger.info('Fetched the juror record expenses info: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
          });

          const dailyExpenses = {
            totalDraft: expensesSummary.total_draft,
            totalForApproval: expensesSummary.total_for_approval,
            totalApproved: expensesSummary.total_approved,
          };

          return res.render('juror-management/juror-record/expenses', {
            backLinkUrl: 'homepage.get',
            juror: jurorOverview.data,
            jurorStatus: resolveJurorStatus(jurorOverview.data.commonDetails),
            currentTab: 'expenses',
            hasSummons: req.session.hasSummonsResponse,
            dailyExpenses,
            defaultExpenses,
            bankDetails,
            viewAllExpensesLink,
            viewDraftExpensesLink,
            viewForApprovalExpensesLink,
            viewApprovedExpensesLink,
            editDefaultExpensesLink,
            editBankDetailsLink,
          });

        } catch (err){
          if (err.statusCode === 404) {
            if (err.error.message.includes('No appearances found for juror')) {
              const dailyExpenses = {
                totalDraft: 0,
                totalForApproval: 0,
                totalApproved: 0,
              };

              return res.render('juror-management/juror-record/expenses', {
                backLinkUrl: 'homepage.get',
                juror: jurorOverview.data,
                jurorStatus: resolveJurorStatus(jurorOverview.data.commonDetails),
                currentTab: 'expenses',
                hasSummons: req.session.hasSummonsResponse,
                dailyExpenses,
                defaultExpenses,
                bankDetails,
                viewAllExpensesLink,
                viewDraftExpensesLink,
                viewForApprovalExpensesLink,
                viewApprovedExpensesLink,
                editDefaultExpensesLink,
                editBankDetailsLink,
              });
            }
            return res.render('juror-management/_errors/not-found');
          }
          app.logger.crit('Failed to fetch the juror expenses data:', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber,
              locationCode: req.session.locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        }

      } catch (err) {
        if (err.statusCode === 404) {
          return res.render('juror-management/_errors/not-found');
        }

        app.logger.crit('Failed to fetch the juror bank details or default expenses data:', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            locationCode: req.session.locCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };


  module.exports.getAttendanceTab = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      let failedToAttend;
      let successBanner = false;

      if (typeof req.session.failedToAttend !== 'undefined'
        && req.session.failedToAttend.jurorNumber === jurorNumber) {
        failedToAttend = req.session.failedToAttend;
        delete req.session.failedToAttend;
      }
      if (req.session.bannerMessage) {
        successBanner = req.session.bannerMessage;
        delete req.session.bannerMessage;
      }

      try {
        clearInvalidSessionData(req);

        const jurorOverview = await jurorRecordObject.record.get(
          require('request-promise'),
          app,
          req.session.authToken,
          'overview',
          jurorNumber,
          req.session.locCode,
        );

        const attendance = await jurorRecordObject.attendanceDetails.get(
          require('request-promise'),
          app,
          req.session.authToken,
          req.session.locCode,
          jurorNumber,
        );


        const dates = attendance.juror_attendance_response_data.map(attendances => {
          const [year, month, day] = attendances.attendance_date;

          return new Date(year, month - 1, day);
        });

        const latestDate = new Date(Math.max(...dates));

        const formattedDate = ('0' + latestDate.getDate()).slice(-2) +
        '/' + ('0' + (latestDate.getMonth() + 1)).slice(-2) + '/' + latestDate.getFullYear();

        jurorOverview.data.commonDetails.onCall = attendance['on_call'];
        cacheJurorCommonDetails(req, jurorOverview.data.commonDetails);
        req.session.jurorAttendanceName = jurorOverview.data.commonDetails.firstName + ' '
        + jurorOverview.data.commonDetails.lastName;
        return res.render('juror-management/juror-record/attendance', {
          backLinkUrl: 'homepage.get',
          currentTab: 'attendance',
          juror: jurorOverview.data,
          successBanner: successBanner,
          jurorStatus: resolveJurorStatus(jurorOverview.data.commonDetails),
          processingOutcome: modUtils.resolveProcessingOutcome(jurorOverview.data.commonDetails.jurorStatus,
            jurorOverview.data.commonDetails.excusalRejected, jurorOverview.data.commonDetails.excusalDescription),
          hasSummons: req.session.hasSummonsResponse,
          attendance,
          formattedDate,
          failedToAttend,
        });
      } catch (err) {
        if (err.statusCode === 404) {
          return res.render('juror-management/_errors/not-found');
        }

        app.logger.crit('Failed to fetch the juror attendance data:', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            locationCode: req.session.locCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.getNotesTab = function(app) {
    return function(req, res) {
      var promiseArr = []
        , successCB = function(response) {
          var contactLogs;

          app.logger.info('Fetched the juror notes and contact logs: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              notes: response[0].data,
              logs: response[1].data.length + ' contact logs',
            },
          });

          if (typeof response === 'undefined') {
            return res.render('juror-management/_errors/not-found');
          }

          // I need to store the response (common details and notes)
          // because they need to be used if the user adds or edits a note
          // ....just another session piece of data to manage 🙃
          req.session.jurorRecord = response[0].data;
          cacheJurorCommonDetails(req, response[0].data.commonDetails);
          // TODO: check lines 262 and 263 for a future refactor

          // I need this because I need to order the logs by latest
          contactLogs = response[1].data.contactLogs
            .map(function(log) {
              log.logDate = new Date(log.logDate);
              return log;
            })
            .sort(function(a, b) {
              return Date.parse(b.logDate) - Date.parse(a.logDate);
            });


          return res.render('juror-management/juror-record/notes', {
            backLinkUrl: 'homepage.get',
            juror: response[0].data,
            currentTab: 'notes',
            contactLogs: contactLogs,
            jurorStatus: resolveJurorStatus(response[0].data.commonDetails),
            hasSummons: req.session.hasSummonsResponse,
          });
        }
        , errorCB = function(err) {
          if (err.statusCode === 404) {
            return res.render('juror-management/_errors/not-found');
          }

          app.logger.crit('Failed to fetch the juror notes and logs: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      clearInvalidSessionData(req);

      promiseArr.push(
        jurorRecordObject.record.get(
          require('request-promise'),
          app,
          req.session.authToken,
          'notes',
          req.params['jurorNumber'],
        ),
      );

      promiseArr.push(
        jurorRecordObject.record.get(
          require('request-promise'),
          app,
          req.session.authToken,
          'contact-log',
          req.params['jurorNumber'],
        ),
      );

      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getEditNotes = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          req.session.etag = response.headers.etag;

          const jurorNotes = typeof req.session.jurorNotes !== 'undefined'
              ? { notes: req.session.jurorNotes } : response.data
            , tmpErrors = _.clone(req.session.errors);

          delete req.session.errors;
          delete req.session.jurorNotes;

          let backLinkUrl = app.namedRoutes.build('juror-record.notes.get', {
            jurorNumber: req.params['jurorNumber'],
          });
          let actionUrl = app.namedRoutes.build('juror-record.notes-edit.post', {
            jurorNumber: req.params['jurorNumber'],
          });

          if (req.url.includes('bank-details')) {
            const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
            const { status } = req.query;

            backLinkUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
              jurorNumber: req.params['jurorNumber'],
              locCode: req.params['locCode'],
            }) + (status ? `?status=${status}` : '');
            actionUrl = app.namedRoutes.build(`${routePrefix}.bank-details.notes-edit.post`, {
              jurorNumber: req.params['jurorNumber'],
              locCode: req.params['locCode'],
            }) + (status ? `?status=${status}` : '');
          }

          return res.render('juror-management/juror-record/notes-edit', {
            backLinkUrl: {
              built: true,
              url: backLinkUrl,
            },
            juror: jurorNotes,
            actionUrl,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , errorCB = function(err) {
          if (err.statusCode === 404) {
            return res.render('juror-management/_errors/not-found');
          }

          app.logger.crit('Failed to fetch the juror notes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (req.url.includes('bank-details')) {
            return res.render('_errors/generic');
          }

          return res.redirect(app.namedRoutes.build('juror-record.notes.get', {
            jurorNumber: req.params['jurorNumber'],
          }));
        };

      jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'notes',
        req.params['jurorNumber'],
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  // this one is a bit weird:
  // because we are using an etag to verify if the resource has been edited we will be waiting for 2 response codes:
  // 200 code: error response because the resource has changed therefore reject the updates
  // 304 code: the resource has not changed so we move and patch the juror's notes
  // of course the promise will resolve if the code is 200 (error) or throw an exception if the code is 304 (success) 😅
  module.exports.postEditNotes = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;

      let successUrl = app.namedRoutes.build('juror-record.notes.get', {
        jurorNumber,
      });
      let backLinkUrl = app.namedRoutes.build('juror-record.notes.get', {
        jurorNumber,
      });
      let actionUrl = app.namedRoutes.build('juror-record.notes-edit.post', {
        jurorNumber,
      });
      let formErrorUrl = app.namedRoutes.build('juror-record.notes-edit.get', {
        jurorNumber,
      });

      if (req.url.includes('bank-details')) {
        const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
        const { locCode } = req.params;
        const { status } = req.query;

        successUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
          jurorNumber,
          locCode,
        }) + (status ? `?status=${status}` : '');
        backLinkUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
          jurorNumber,
          locCode,
        }) + (status ? `?status=${status}` : '');
        actionUrl = app.namedRoutes.build(`${routePrefix}.bank-details.notes-edit.post`, {
          jurorNumber,
          locCode,
        }) + (status ? `?status=${status}` : '');
        formErrorUrl = app.namedRoutes.build(`${routePrefix}.bank-details.notes-edit.get`, {
          jurorNumber,
          locCode,
        }) + (status ? `?status=${status}` : '');
      }

      const editSuccessCB = function() {
          app.logger.info('Updated the juror notes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              notes: req.body.notes,
            },
          });

          delete req.session.jurorNotes;

          return res.redirect(successUrl);
        }
        , resourceChangedCB = function(response) {

          app.logger.warn('The juror notes have been modified: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              notes: req.body.notes,
            },
          });

          return res.render('juror-management/juror-record/notes-edit', {
            backLinkUrl: {
              built: true,
              url: backLinkUrl,
            },
            juror: response.data,
            actionUrl: actionUrl,
            errorMessage: 'This record has been modified',
          });
        }
        , errorCB = function(err) {
          if (err.statusCode === 304) {
            delete req.session.etag;

            return jurorRecordObject.notes.patch(
              require('request-promise'),
              app,
              req.session.authToken,
              req.body,
              req.params['jurorNumber'],
            )
              .then(editSuccessCB)
              .catch(errorCB);
          }

          if (err.statusCode === 404) {
            return res.render('juror-management/_errors/not-found');
          }

          app.logger.crit('Failed to update the jurors notes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              notes: req.body.notes,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      if (req.body.notes.length > 2000) {
        req.session.errors = {
          notes: [{
            details: 'The notes provided are too long',
            summary: 'The notes provided are too long',
          }],
        };

        req.session.jurorNotes = req.body.notes;

        return res.redirect(formErrorUrl);
      }

      jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'notes',
        req.params['jurorNumber'],
        req.session.authentication.owner, // TODO: Verify this?
        (typeof req.session.etag !== 'undefined') ? req.session.etag : '',
      )
        .then(resourceChangedCB)
        .catch(errorCB);
    };
  };

  // logs dont need version checking because each post is a different entry on the database
  // and each entry will be added by the same user that got the contact call (i guess?)
  module.exports.getAddLogs = function(app) {
    return function(req, res) {
      var tmpErrors
        , successCB = function(response) {
          var enquiryTypes;

          app.logger.info('Fetched the enquiry types: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              response: response,
            },
          });

          // reduce the enquiry types array into an array that can be displayed via an html select
          enquiryTypes = response.data.enquiryTypes.reduce(function(arr, enquiryType) {
            return arr.concat({ value: enquiryType.enquiryCode, text: enquiryType.description });
          }, []);

          return res.render('juror-management/juror-record/contact-logs-add', {
            backLinkUrl: {
              url: app.namedRoutes.build('juror-record.notes.get', {
                jurorNumber: req.params['jurorNumber'],
              }),
              built: true,
            },
            actionUrl: app.namedRoutes.build('juror-record.contact-log.post', {
              jurorNumber: req.params['jurorNumber'],
            }),
            juror: req.session.jurorRecord,
            enquiryTypes: enquiryTypes,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , errorCB = function(err) {
          if (err.statusCode === 404) {
            return res.render('juror-management/_errors/not-found');
          }

          app.logger.crit('Failed to fetch types of enquiry: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          // redirect to the same logs tab for now
          return res.redirect(app.namedRoutes.build('juror-record.notes.get', {
            jurorNumber: req.params['jurorNumber'],
          }) + '#contactLogTab');
        };

      tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      // on this case we can use the same request object but without the juror-number
      // ... we still need the juror-number though but because the api endpoint still needs the extra url part
      // then the juror number can be replaced with this part (enquiry-types)
      jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'contact-log/enquiry-types',
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postAddLogs = function(app) {
    return function(req, res) {
      var tmpBody = _.clone(req.body)
        , successCB = function() {

          app.logger.info('Posted a new contact log: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              body: tmpBody,
            },
          });

          return res.redirect(app.namedRoutes.build('juror-record.notes.get', {
            jurorNumber: req.params['jurorNumber'],
          }) + '#contactLogTab');
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to add a new contact log: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              data: req.body,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          // redirect to the same logs tab for now
          return res.redirect(app.namedRoutes.build('juror-record.notes.get', {
            jurorNumber: req.params['jurorNumber'],
          }) + '#contactLogTab');
        };

      const validator = require('../../../config/validation/juror-record');
      const validatorResult = validate(req.body, validator.contactLog());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror-record.contact-log.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      tmpBody.startCall = dateFilter(new Date(), null, 'YYYY-MM-DD HH:mm:ss');

      jurorRecordObject.contactLog.post(
        require('request-promise'),
        app,
        req.session.authToken,
        tmpBody,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  function clearInvalidSessionData(req) {
    delete req.session.paperResponseDetails;
    delete req.session.startedPaperResponse;
    delete req.session.jurorCommonDetails;
    delete req.session.receivingCourtLocCode;
    delete req.session.replyMethod;
    delete req.session.postponeToDate;
    delete req.session.changeName;
    delete req.session.editJurorDetails;
  }

  function cacheJurorCommonDetails(req, commonDetails) {
    req.session.jurorCommonDetails = commonDetails;
  }

  function resolveJurorStatus(commonDetails) {
    if (commonDetails.jurorStatus === 'Excused' && commonDetails.excusalCode === 'D') {
      return 'Deceased';
    }

    if (commonDetails.jurorStatus === 'Responded' && commonDetails.excusalRejected !== null) {
      return 'Responded <span class="icon mod-icon-urgent"></span>';
    }

    if (commonDetails.jurorStatus === 'Deferred' && commonDetails.excusalCode === 'P') {
      return 'Postponed';
    }

    return commonDetails.jurorStatus;
  }

  function buildPooldetailsRows(n, commonDetails) {
    const rows = []
      , poolUrl = commonDetails.jurorStatus === 'Deferred'
        ? `<a class="govuk-link--no-visited-state" id="deferralMaintenanceAnchor"
          href="${n.build('pool-management.deferral-maintenance.get')}"/>In deferral maintenance</a>`
        : `<a class="govuk-link--no-visited-state" id="poolOverviewAnchor"
          href="${n.build('pool-overview.get', { poolNumber: commonDetails.poolNumber })}"/>
          ${commonDetails.poolNumber}</a>`;

    rows.push({
      key: {
        text: 'Pool number',
      },
      value: {
        html: poolUrl,
      },
    });

    rows.push({
      key: {
        text: 'Court name',
      },
      value: {
        text: capitalizeFully(commonDetails.courtName),
      },
    });

    rows.push({
      key: {
        text: 'Court type',
      },
      value: {
        text: commonDetails.courtType || 'Crown court',
      },
    });

    if (commonDetails.jurorStatus !== 'Deferred') {
      rows.splice(2, 0, {
        key: {
          text: 'Service start date',
        },
        value: {
          text: dateFilter(makeDate(commonDetails.startDate), null, 'dddd D MMMM YYYY'),
        },
      });
    }

    return rows;
  }

  function resolvePoliceCheckStatus(req, status) {
    const errorArray = [
      'ERROR_RETRY_NAME_HAS_NUMERICS',
      'ERROR_RETRY_CONNECTION_ERROR',
      'ERROR_RETRY_OTHER_ERROR_CODE',
      'ERROR_RETRY_NO_ERROR_REASON',
      'ERROR_RETRY_UNEXPECTED_EXCEPTION',
      'UNCHECKED_MAX_RETRIES_EXCEEDED',
    ];
    let canRetry = false;
    let _status;

    switch (status) {
    case 'NOT_CHECKED':
    case 'INSUFFICIENT_INFORMATION':
      _status = 'Not Checked';
      break;
    case 'IN_PROGRESS':
      _status = 'In Progress';
      break;
    case 'ELIGIBLE':
      _status = 'Passed';
      break;
    case 'INELIGIBLE':
      _status = '<span class="mod-red-text">Failed</span>';
      break;
    case 'UNCHECKED_MAX_RETRIES_EXCEEDED':
      _status = 'Not Checked - <span class="mod-red-text">There was a problem</span>';

      if (isCourtUser(req)) {
        canRetry = true;
      }

      break;
    case 'ERROR_RETRY_NAME_HAS_NUMERICS':
    case 'ERROR_RETRY_CONNECTION_ERROR':
    case 'ERROR_RETRY_OTHER_ERROR_CODE':
    case 'ERROR_RETRY_NO_ERROR_REASON':
    case 'ERROR_RETRY_UNEXPECTED_EXCEPTION':
      _status = 'In Progress';

      if (isCourtUser(req)) {
        _status = 'Not Checked - <span class="mod-red-text">There was a problem</span>';
        canRetry = true;
      }

      break;
    default:
      _status = 'Not Checked';
      break;
    }

    return { status: _status, rawStatus: status || 'NOT_CHECKED', canRetry, errorArray };
  }

  async function resolveIdCheckDescription(app, req, idCheckCode) {
    if (!idCheckCode) return Promise.resolve('');

    const { description } = (await systemCodesDAO.get(app, req, 'ID_CHECK')).find(({ code }) => code === idCheckCode);

    return Promise.resolve(description);
  }

})();
