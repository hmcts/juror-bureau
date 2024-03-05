const { defaultExpensesDAO, jurorBankDetailsDAO } = require('../../../objects/expenses');

(function() {
  'use strict';

  const _ = require('lodash')
    , { dateFilter, capitalizeFully, makeDate } = require('../../../components/filters')
    , { isCourtUser } = require('../../../components/auth/user-type')
    , jurorRecordObject = require('../../../objects/juror-record')
    , validate = require('validate.js')
    , modUtils = require('../../../lib/mod-utils');

  function render(req, res, tab, jurorNumber, other) {

    return res.render('juror-management/juror-record/' + tab, {
      backLinkUrl: 'homepage.get',
      juror: {
        commonDetails: {
          title: 'Rev',
          firstName: 'James',
          lastName: 'Rashad',
          jurorNumber: jurorNumber,
          jurorStatus: 'Summoned',
          poolNumber: '101',
          startDate: ['2022', '1', '1'],
          courtName: 'PRESTON COMBINED COURT CENTRE',
        },
      },
      currentTab: tab,
      hasSummons: req.session.hasSummonsResponse,
      ...other,
    });
  }

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
      var successCB = function(response) {
          var availableMessage = false
            , bannerMessage
            , canSummon = true
            , jurorStatus = resolveJurorStatus(response.data.commonDetails);

          app.logger.info('Fetched the juror record overview: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              response: response.data,
            },
          });

          if (typeof response.data === 'undefined') {
            return res.render('_errors/generic');
          }

          if (req.session.bannerMessage) {
            availableMessage = true;
          }

          bannerMessage = req.session.bannerMessage;
          delete req.session.bannerMessage;

          req.session.jurorUpdate = {
            poolNumber: response.data.commonDetails.poolNumber,
            currentAttendanceDate: response.data.commonDetails.startDate,
          };
          cacheJurorCommonDetails(req, response.data.commonDetails);

          const poolDetails = buildPooldetailsRows(app.namedRoutes, response.data.commonDetails);

          if (response.data.commonDetails.owner !== '400' && !isCourtUser(req)) {
            canSummon = false;
          };

          switch (jurorStatus) {
          case 'Undeliverable':
          case 'Responded':
          case 'Completed':
            canSummon = false;
            break;
          };

          // TODO: handle the backLink
          return res.render('juror-management/juror-record/overview', {
            backLinkUrl: 'homepage.get',
            juror: response.data,
            canSummon,
            currentTab: 'overview',
            jurorStatus,
            bannerMessage: bannerMessage,
            availableMessage: availableMessage,
            hasSummons: req.session.hasSummonsResponse,
            poolDetails,
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

      jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'overview',
        req.params['jurorNumber'],
        req.session.locCode,
      )
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

        const defaultExpenses = await defaultExpensesDAO.get(app, req, jurorNumber);

        const { response: bankDetails } = await jurorBankDetailsDAO.get(app, req, jurorNumber);

        cacheJurorCommonDetails(req, jurorOverview.data.commonDetails);

        app.logger.info('Fetched the juror record expenses info: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
        });

        // TODO - replace with data from API call
        const dailyExpenses = {
          totalDraft: 110,
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
          viewAllExpensesLink: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
          viewDraftExpensesLink: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
            jurorNumber: jurorNumber, poolNumber: jurorOverview.data.commonDetails.poolNumber, status: 'draft',
          }),
          viewForApprovalExpensesLink: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
            jurorNumber: jurorNumber, poolNumber: jurorOverview.data.commonDetails.poolNumber, status: 'for-approval',
          }),
          viewApprovedExpensesLink: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
            jurorNumber: jurorNumber, poolNumber: jurorOverview.data.commonDetails.poolNumber, status: 'approved',
          }),
          editSubmittedExpensesLink: '#',
          editDefaultExpensesLink: app.namedRoutes.build('juror-record.default-expenses.get', {
            jurorNumber: jurorNumber, poolNumber: jurorOverview.data.commonDetails.poolNumber,
          }),
          editBankDetailsLink: app.namedRoutes.build('juror-record.bank-details.get', {
            jurorNumber: jurorNumber, poolNumber: jurorOverview.data.commonDetails.poolNumber,
          }),
        });
      } catch (err) {
        if (err.statusCode === 404) {
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
    };
  };


  module.exports.getAttendanceTab = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      let failedToAttend;

      if (typeof req.session.failedToAttend !== 'undefined'
        && req.session.failedToAttend.jurorNumber === jurorNumber) {
        failedToAttend = req.session.failedToAttend;
        delete req.session.failedToAttend;
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
          jurorNumber,
          jurorOverview.data.commonDetails.poolNumber,
        );

        jurorOverview.data.commonDetails.onCall = attendance['on_call'];
        cacheJurorCommonDetails(req, jurorOverview.data.commonDetails);

        return res.render('juror-management/juror-record/attendance', {
          backLinkUrl: 'homepage.get',
          currentTab: 'attendance',
          juror: jurorOverview.data,
          jurorStatus: resolveJurorStatus(jurorOverview.data.commonDetails),
          processingOutcome: modUtils.resolveProcessingOutcome(jurorOverview.data.commonDetails.jurorStatus,
            jurorOverview.data.commonDetails.excusalRejected, jurorOverview.data.commonDetails.excusalDescription),
          hasSummons: req.session.hasSummonsResponse,
          attendance,
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

            backLinkUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
              jurorNumber: req.params['jurorNumber'],
              poolNumber: req.params['poolNumber'],
            });
            actionUrl = app.namedRoutes.build(`${routePrefix}.bank-details.notes-edit.post`, {
              jurorNumber: req.params['jurorNumber'],
              poolNumber: req.params['poolNumber'],
            });
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

      let successUrl = app.namedRoutes.build('juror-record.notes.get', {
        jurorNumber: req.params['jurorNumber'],
      });
      let backLinkUrl = app.namedRoutes.build('juror-record.notes.get', {
        jurorNumber: req.params['jurorNumber'],
      });
      let actionUrl = app.namedRoutes.build('juror-record.notes-edit.post', {
        jurorNumber: req.params['jurorNumber'],
      });
      let formErrorUrl = app.namedRoutes.build('juror-record.notes-edit.get', {
        jurorNumber: req.params['jurorNumber'],
      });

      if (req.url.includes('bank-details')) {
        const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';

        successUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
          jurorNumber: req.params['jurorNumber'],
          poolNumber: req.params['poolNumber'],
        });
        backLinkUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
          jurorNumber: req.params['jurorNumber'],
          poolNumber: req.params['poolNumber'],
        });
        actionUrl = app.namedRoutes.build(`${routePrefix}.bank-details.notes-edit.post`, {
          jurorNumber: req.params['jurorNumber'],
          poolNumber: req.params['poolNumber'],
        });
        formErrorUrl = app.namedRoutes.build(`${routePrefix}.bank-details.notes-edit.get`, {
          jurorNumber: req.params['jurorNumber'],
          poolNumber: req.params['poolNumber'],
        });
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

})();
