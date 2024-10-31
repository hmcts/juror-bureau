(function() {
  'use strict';

  var _ = require('lodash')
    , moment = require('moment')
    , isBureauUser = require('../../components/auth/user-type').isBureauUser
    , paperReplyObj = require('../../objects/paper-reply').paperReplyObject
    , excusalObj = require('../../objects/excusal-mod').excusalObject
    , deferralObj = require('../../objects/deferral-mod').deferralObject
    , preferredDatesObj = require('../../objects/deferral-preferred-dates').preferredDatesObj
    , deferralPoolsObj = require('../../objects/deferral-available-pools').object
    , validate = require('validate.js')
    , filters = require('../../components/filters')
    , dateFilter = require('../../components/filters').dateFilter
    , modUtils = require('../../lib/mod-utils')
    , opticReferenceObj = require('../../objects/juror-record').opticReferenceObject
    , opticReferenceValidator = require('../../config/validation/optic-reference')
    , deferralJurorValidator = require('../../config/validation/deferral-juror')
    , deferralDatePickerValidator = require('../../config/validation/date-picker').deferralDatePicker
    , otherDeferralDateValidater = require('../../config/validation/deferral-mod').deferralDateAndReason
    , courtLocationsFromPostcodeObj = require('../../objects/court-location').courtLocationsFromPostcodeObj
    , { systemCodesDAO } = require('../../objects/administration');
  const { flowLetterPost, flowLetterGet } = require('../../lib/flowLetter');

  const dateHint = 'Use dd/mm/yyyy format. For example, 31/01/2024.';

  module.exports.getDeferralDates = function(app) {
    return async function(req, res) {

      let tmpErrors = _.clone(req.session.errors)
        , routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        }
        , datesEntered = {
          firstChoiceDate: '',
          secondChoiceDate: '',
          thirdChoiceDate: '',
        }
        , errorsToDisplay = {
          firstError: '',
          secondError: '',
          thirdError: '',
        }
        , cancelUrl
        , processUrl
        , backLinkUrl;

      delete req.session.errors;
      delete req.session.formFields;

      let enteredDates = req.session.deferralDatesEntered;

      delete req.session.deferralDatesEntered;

      if (typeof enteredDates !== 'undefined') {
        datesEntered.firstChoiceDate = enteredDates[0];
        datesEntered.secondChoiceDate = enteredDates[1];
        datesEntered.thirdChoiceDate = enteredDates[2];
      }

      // determine start date of juror and ensure user cannot enter before that
      if (req.session.replyDetails.jurorStartDate) {
        const _date = new Date(req.session.replyDetails.jurorStartDate.split('/').reverse());

        req.session.minDate = _date;
        req.session.maxDate = new Date(moment(_date).add(12, 'M'));
      }

      processUrl = app.namedRoutes.build('process-deferral-dates.post', routeParameters);

      if (req.params['type'] === 'paper') {
        cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
      } else {
        cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
      }

      backLinkUrl = app.namedRoutes.build('process-reply.get', routeParameters);

      // Get preferred dates from backend if digital
      if (routeParameters.type === 'digital') {
        try {
          const digitalDates = await preferredDatesObj.get(
            require('request-promise'),
            app,
            req.session.authToken,
            req.params['id'],
          );

          app.logger.info('Retrieved preferred deferral dates: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: digitalDates,
          });
          // if there are deferral dates selected on digital reply, move straight to select pool screen
          if (digitalDates.length !== 0){
            processUrl = app.namedRoutes.build('process-deferral.get', routeParameters);
            req.session.deferralDates = digitalDates;
            req.session.otherDateSearch = 'false';
            return res.redirect(processUrl);
          }
        } catch (err){
          app.logger.crit('Failed to retrive preferred deferral dates: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        }
      }

      let errorCount = 0;

      if (typeof tmpErrors !== 'undefined') {
        if (typeof tmpErrors.deferredToDate1 !== 'undefined' && tmpErrors.deferredToDate1 !== null){
          errorsToDisplay.firstError = tmpErrors.deferredToDate1[0].summary;
          errorCount++;
        }
        if (typeof tmpErrors.deferredToDate2 !== 'undefined' && tmpErrors.deferredToDate2 !== null){
          errorsToDisplay.secondError = tmpErrors.deferredToDate2[0].summary;
          errorCount++;
        }
        if (typeof tmpErrors.deferredToDate3 !== 'undefined' && tmpErrors.deferredToDate3 !== null){
          errorsToDisplay.thirdError = tmpErrors.deferredToDate3[0].summary;
          errorCount++;
        }
      }

      return res.render('summons-management/deferral-dates', {
        jurorNumber: req.params['id'],
        jurorDetails: req.session.jurorDetails,
        minDate: dateFilter(moment(req.session.minDate).add(1, 'days'), null, 'DD/MM/YYYY'),
        maxDate: dateFilter(moment(req.session.maxDate).subtract(1, 'days'), null, 'DD/MM/YYYY'),
        cancelUrl,
        backLinkUrl,
        processUrl,
        datesEntered,
        errorsToDisplay,
        dateHint,
        errors: {
          title: 'Please check the form',
          count: errorCount,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postDeferralDates = function(app) {
    return function(req, res) {
      // validate if we have at least one date, and if so then on to getDeferral
      let deferralDatesSelected = []
        , tmpErrors = {
          deferredToDate1: null,
          deferredToDate2: null,
          deferredToDate3: null,
        }
        , deferralDates = []
        , routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        }
        , minDate
        , maxDate;

      delete req.session.errors;
      delete req.session.formFields;


      if (req.body.deferredToDate1 === '' && req.body.deferredToDate2 === '' && req.body.deferredToDate3 === '') {
        req.session.errors = {
          deferredToDate1: [{
            summary: 'Enter at least one preferred start date for this juror',
            details: 'Enter at least one preferred start date for this juror',
          }],
        };
        return res.redirect(app.namedRoutes.build('process-deferral-dates.get', routeParameters));
      }

      deferralDatesSelected.push(req.body.deferredToDate1);
      deferralDatesSelected.push(req.body.deferredToDate2);
      deferralDatesSelected.push(req.body.deferredToDate3);

      minDate = new Date(req.session.minDate);
      maxDate = new Date(req.session.maxDate);

      //Determine non-empty dates, validate these, if valid add to deferralDates array, if not show error
      if (req.body.deferredToDate1 !== ''){
        let validatorResult =
            validate({dateToCheck: req.body.deferredToDate1}, deferralDatePickerValidator(minDate, maxDate));

        if (typeof validatorResult !== 'undefined') {
          tmpErrors.deferredToDate1 = validatorResult.dateToCheck;
        } else {
          deferralDates.push(createDeferralDate(req.body.deferredToDate1));
        }
      }

      if (req.body.deferredToDate2 !== ''){
        let validatorResult =
            validate({dateToCheck: req.body.deferredToDate2}, deferralDatePickerValidator(minDate, maxDate));

        if (typeof validatorResult !== 'undefined') {
          tmpErrors.deferredToDate2 = validatorResult.dateToCheck;
        } else {
          deferralDates.push(createDeferralDate(req.body.deferredToDate2));
        }
      }

      if (req.body.deferredToDate3 !== ''){
        let validatorResult =
            validate({dateToCheck: req.body.deferredToDate3}, deferralDatePickerValidator(minDate, maxDate));

        if (typeof validatorResult !== 'undefined') {
          tmpErrors.deferredToDate3 = validatorResult.dateToCheck;
        } else {
          deferralDates.push(createDeferralDate(req.body.deferredToDate3));
        }
      }


      req.session.deferralDatesEntered = deferralDatesSelected;

      req.session.deferralDates = deferralDates;

      if (tmpErrors.deferredToDate1 !== null || tmpErrors.deferredToDate2 !== null
       || tmpErrors.deferredToDate3 !== null) {
        req.session.errors = tmpErrors;
        return res.redirect(app.namedRoutes.build('process-deferral-dates.get', routeParameters));
      }

      // save the dates for next screen
      req.session.minDate = new Date(minDate);
      req.session.maxDate = new Date(maxDate);

      req.session.otherDateSearch = 'false';

      // redirect to deferral get
      return res.redirect(app.namedRoutes.build('process-deferral.get', routeParameters));

    };
  };


  module.exports.getDeferral = function(app) {
    return function(req, res) {

      let tmpErrors = _.clone(req.session.errors)
        , routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        }
        , tmpFields = !!req.session.formFields ? req.session.formFields : {}
        , cancelUrl
        , postBody = {}
        , backLinkUrl
        , processUrl
        , defaultDate = new Date()
        , successCB = function(poolOptions) {
          app.logger.info('Fetch pool options:  ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: postBody,
            response: poolOptions,
          });

          //GET DEFFERAL CODES FROM BACKEND
          systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL')
            .then((data) => {
              app.logger.info('Retrieved excusal codes: ', {
                auth: req.session.authentication,
                jwt: req.session.authToken,
                data: data,
              });

              let trimmedReasons = data.filter((reasonObj) => {
                return reasonObj.code !== 'D'
                    && reasonObj.code !== 'P';
              });

              delete req.session.errors;
              delete req.session.formFields;
              delete req.session.deferralReasons;

              if (req.params['type'] === 'paper') {
                cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
                backLinkUrl = app.namedRoutes.build('process-deferral-dates.get', routeParameters);
              } else {
                cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
                backLinkUrl = app.namedRoutes.build('response.detail.get', routeParameters);
              }
              processUrl = app.namedRoutes.build('process-deferral.post', routeParameters);

              let deferralSelectedReason = !!req.session.deferralSelectedReason
                  ? req.session.deferralSelectedReason : ''
                , noPools = 'false';

              delete req.session.deferralSelectedReason;

              req.session.deferralReasons = trimmedReasons;

              //If searching for singular other date
              if (req.session.otherDateSearch === 'true'){
                if (req.params['type'] === 'paper') {
                  backLinkUrl = app.namedRoutes.build('process-deferral.get', routeParameters);
                } else {
                  backLinkUrl = app.namedRoutes.build('process-deferral-dates.get', routeParameters);
                }

                if (poolOptions.deferralPoolsSummary.length !== 0
                  && poolOptions.deferralPoolsSummary[0].deferralOptions[0].poolNumber === null
                  && tmpFields.deferralOption === 'otherDate') {
                  // we have a date with no pools
                  noPools = 'true';
                  req.session.otherDateSearch = 'false';
                }
              }

              return res.render('summons-management/deferral', {
                jurorNumber: routeParameters.id,
                type: routeParameters.type,
                deferralReasons: trimmedReasons,
                jurorDetails: req.session.jurorDetails,
                cancelUrl,
                backLinkUrl,
                defaultDate,
                processUrl,
                noPools,
                deferralPoolsSummary: poolOptions.deferralPoolsSummary,
                deferralSelectedReason,
                errors: {
                  title: 'Please check the form',
                  count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
                  items: tmpErrors,
                },
                minDate: dateFilter(moment(req.session.minDate).add(1, 'days'), null, 'DD/MM/YYYY'),
                maxDate: dateFilter(moment(req.session.maxDate).subtract(1, 'days'), null, 'DD/MM/YYYY'),
                dateHint,
                deferralSelections: tmpFields,
                otherDateSearch: req.session.otherDateSearch,
              });

            })
            .catch(() => {
              app.logger.crit('Failed to retrive excusal codes: ', {
                auth: req.session.authentication,
                jwt: req.session.authToken,
              });

              return res.render('_errors/generic');
            });

        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch pool options: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.redirect(app.namedRoutes.build('process-deferral-dates.get', routeParameters));
        };


      // get the available pools for these dates
      postBody.deferralDates = req.session.deferralDates;

      deferralPoolsObj.post(
        req,
        postBody,
        req.params['id'],
      )
        .then(successCB)
        .catch(errorCB);
    };
  };


  module.exports.postDeferral = function(app) {
    return function(req, res) {
      let validatorResult
        , data = {}
        , deferralDates = []
        , optionSelected = []
        , replyMethod = req.params['type']
        , routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        }
        , sentToDeferral = req.body.sendToDeferralMaintence ? req.body.sendToDeferralMaintence : null
        , successCB = function() {

          let codeMessage = (code) => req.session.deferralReasons.filter((el) => el.code === code)[0].description
            , deferralMessage = 'Deferral granted (' + codeMessage(req.body.deferralReason).toLowerCase() + ')';

          req.session.responseWasActioned = {
            jurorDetails: req.session.replyDetails,
            type: deferralMessage,
          };

          app.logger.info('Deferral processed: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
          });

          delete req.session.deferralDates;
          delete req.session.minDate;
          delete req.session.maxDate;
          delete req.session.otherDateSearch;
          delete req.session.deferralDatesEntered;
          delete req.session.deferralReasons;

          if (req.session.receivingCourtLocCode) {
            req.session.locCode = _.clone(req.session.receivingCourtLocCode);
          }
          delete req.session.receivingCourtLocCode;

          if (res.locals.isCourtUser) {
            return res.redirect(app.namedRoutes.build('process-deferral.letter.get', routeParameters));
          }

          if (routeParameters.type === 'paper') {
            return res.redirect(app.namedRoutes.build('response.paper.details.get', routeParameters));
          }
          return res.redirect(app.namedRoutes.build('response.detail.get', routeParameters));
        }
        , errorCB = function(err) {
          if (err.statusCode === 422) {
            switch (err.error?.code) {
              case 'CANNOT_DEFER_TO_EXISTING_POOL':      
                req.session.errors = modUtils.makeManualError('deferralDateSelection', 'You cannot defer into the juror\'s existing pool - please select a different pool or date');
                break;
              case 'JUROR_DATE_OF_BIRTH_REQUIRED':
                req.session.errors = modUtils.makeManualError('deferralDateSelection', 'You cannot defer a juror without a date of birth - please add date of birth to the juror record');
                break;
              default:
                app.logger.crit('Failed to process Deferral: ', {
                  auth: req.session.authentication,
                  jwt: req.session.authToken,
                  data: req.body,
                  error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
                });
                req.session.errors = modUtils.makeManualError('deferralDateSelection', 'Something went wrong when trying to defer the juror');
            }
            
            req.session.formFields = req.body;
            return res.redirect(app.namedRoutes.build('process-deferral.get', routeParameters));
          }

          app.logger.crit('Failed to process Deferral: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
  
          return res.render('_errors/generic');
          
        };


      // if other date selected, redirect to get pool options using only this date.
      if (req.body.deferralOption === 'otherDate' && sentToDeferral === null) {

        validatorResult = validate({deferralDate: req.body.deferralDate, deferralReason: req.body.deferralReason}
          , otherDeferralDateValidater(req.session.minDate, req.session.maxDate));

        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.deferralSelectedReason = req.body.deferralReason;
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('process-deferral.get', routeParameters));
        }
        deferralDates.push(createDeferralDate(req.body.deferralDate));
        req.session.deferralDates = deferralDates;
        req.session.deferralSelectedReason = req.body.deferralReason;
        req.session.formFields = req.body;
        req.session.otherDateSearch = 'true';

        return res.redirect(app.namedRoutes.build('process-deferral.get', routeParameters));
      }

      validatorResult = validate(req.body, deferralJurorValidator());

      if (typeof validatorResult !== 'undefined' && sentToDeferral === null) {
        req.session.errors = validatorResult;
        req.session.deferralSelectedReason = req.body.deferralReason;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('process-deferral.get', routeParameters));
      }

      if (sentToDeferral !== null){
        data.deferralDate = new Date(req.session.deferralDates[0]);  // we should always get date
        data.deferralReason = req.body.deferralReason;
      } else {
        optionSelected = req.body.deferralOption.split('_');
        data.deferralDate = new Date(optionSelected[0]);  // we should always get date
        data.poolNumber = optionSelected[1] ? optionSelected[1] : null;
        data.deferralReason = req.body.deferralReason;
      }

      data.replyMethod = replyMethod ? replyMethod: routeParameters.type;
      req.session.deferralReason = req.body.deferralReason;

      deferralObj.post(
        req,
        routeParameters.id,
        data.poolNumber,
        data.deferralDate,
        data.deferralReason,
        data.replyMethod,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getDeferralLetter = function(app) {
    return function(req, res) {
      return flowLetterGet(req, res, {
        serviceTitle: 'send letter',
        pageIdentifier: 'process - what to do',
        currentApp: 'Summons replies',
        letterMessage: 'a deferral granted',
        letterType: 'deferral-granted',
        postUrl: app.namedRoutes.build('process-deferral.letter.post', {
          id: req.params.id,
          type: req.params.type,
        }),
        cancelUrl: app.namedRoutes.build('inbox.todo.get'),
      });
    };
  };

  module.exports.postDeferralLetter = function(app) {
    return function(req, res) {
      return flowLetterPost(req, res, {
        errorRoute: app.namedRoutes.build('process-deferral.letter.get', {
          id: req.params.id,
          type: req.params.type,
        }),
        pageIdentifier: 'process - what to do',
        serviceTitle: 'send letter',
        currentApp: 'Summons replies',
        completeRoute: app.namedRoutes.build('inbox.todo.get'),
      });
    };
  };

  module.exports.getExcusal = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors)
        , tmpFields
        , routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        }
        , processUrl
        , cancelUrl
        , backLinkUrl
        , successCB = function(data) {

          app.logger.info('Retrieved excusal codes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params['id'],
            type: req.params['type'],
            data: data,
          });

          tmpFields = req.session.formFields;

          delete req.session.errors;
          delete req.session.formFields;

          req.session.excusalReasons = data;

          return res.render('summons-management/excusal', {
            processUrl: processUrl,
            cancelUrl: cancelUrl,
            backLinkUrl: backLinkUrl,
            excusalDetails: tmpFields,
            excusalReasons: data,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to retrive excusal: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params['id'],
            type: req.params['type'],
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('process-reply.get', routeParameters));
        };

      processUrl = app.namedRoutes.build('process-excusal.post', routeParameters);
      backLinkUrl = {
        built: true,
        url: app.namedRoutes.build('process-reply.get', routeParameters),
      };
      if (req.params['type'] === 'paper') {
        cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
      } else {
        cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
      }

      systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL')
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postExcusal = function(app) {
    return function(req, res) {
      var validatorResult
        , routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        }
        , successCB = function() {
          var codeMessage = (code) => req.session.excusalReasons.filter((el) => el.code === code)[0].description
            , reason = {
              REFUSE: 'Excusal refused (' + codeMessage(req.body.excusalCode).toLowerCase() + ')',
              GRANT: 'Excusal granted (' + codeMessage(req.body.excusalCode).toLowerCase() + ')',
            };

          req.session.responseWasActioned = {
            jurorDetails: req.session.replyDetails,
            type: reason[req.body.excusalDecision],
          };

          app.logger.info('Excusal processed: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
          });

          delete req.session.excusalReasons;

          if (res.locals.isCourtUser) {
            return res.redirect(app.namedRoutes.build('process-excusal.letter.get', {
              ...routeParameters,
              letter: req.body.excusalDecision.toLowerCase(),
            }));
          }

          if (routeParameters.type === 'paper') {
            return res.redirect(app.namedRoutes.build('response.paper.details.get', routeParameters));
          }
          return res.redirect(app.namedRoutes.build('response.detail.get', routeParameters));
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to process excusal: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.errors = {
            summary: [],
          };

          if (typeof err.error !== 'undefined' && err.error.message) {
            req.session.errors.summary.push(err.error.message);
          } else {
            req.session.errors.summary.push('Something went wrong when trying to process this summons');
          }

          return res.redirect(app.namedRoutes.build('process-excusal.get', routeParameters));
        };

      validatorResult = validate(req.body, require('../../config/validation/excusal-mod.js')());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('process-excusal.get', routeParameters));
      }

      excusalObj.put(
        require('request-promise'),
        app,
        req.session.authToken,
        req.body,
        routeParameters.id,
        routeParameters.type,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getExcusalLetter = function(app) {
    return function(req, res) {
      const letterType = req.params.letter === 'grant' ? 'granted' : 'refused';

      return flowLetterGet(req, res, {
        serviceTitle: 'send letter',
        pageIdentifier: 'process - what to do',
        currentApp: 'Summons replies',
        letterMessage: `an excusal ${letterType} `,
        letterType: `excusal-${letterType}`,
        postUrl: app.namedRoutes.build('process-excusal.letter.post', {
          id: req.params.id,
          type: req.params.type,
          letter: req.params.letter,
        }),
        cancelUrl: app.namedRoutes.build('inbox.todo.get'),
      });
    };
  };

  module.exports.postExcusalLetter = function(app) {
    return function(req, res) {
      return flowLetterPost(req, res, {
        errorRoute: app.namedRoutes.build('process-excusal.letter.get', {
          id: req.params.id,
          type: req.params.type,
          letter: req.params.letter.toLowerCase(),
        }),
        pageIdentifier: 'process - what to do',
        serviceTitle: 'send letter',
        currentApp: 'Summons replies',
        completeRoute: app.namedRoutes.build('inbox.todo.get'),
      });
    };
  };

  module.exports.getPaperResponseDetails = function(app) {
    return function(req, res) {
      const { id } = req.params;
      var promiseArr = []
        , successCB = function(response) {
          var responseClone = _.clone(response[0].data)
            , nameDetails
            , addressDetails
            , jurorDetails
            , importantNavItems
            , eligibilityDetails
            , thirdPartyDetails;

          nameDetails = resolveJurorName(responseClone);
          addressDetails = resolveJurorAddress(responseClone);
          thirdPartyDetails = resolveThirdParty(responseClone);

          delete req.session.jurorDetails;
          delete req.session.jurorName;
          delete req.session.specialNeeds;
          delete req.session[`catchmentWarning-${id}`];
          delete req.session[`summonsUpdate-${id}`];

          jurorDetails = {
            name: nameDetails,
            phone: {
              current: responseClone.primaryPhone,
            },
            altPhone: {
              current: responseClone.secondaryPhone,
            },
            email: resolveJurorEmail(responseClone),
            dateOfBirth: resolveJurorDob(responseClone),
            poolNumber: responseClone.poolNumber,
            replyType: 'paper',
          };

          req.session.jurorDetails = jurorDetails;

          responseClone.jurorDetailsComplete = isComplete({
            name: nameDetails.currentName,
            address: { addressLineOne: responseClone.addressLineOne, addressTown: responseClone.addressTown, addressPostcode: responseClone.addressPostcode },
            dob: responseClone.dateOfBirth,
          });

          req.session.jurorName = nameDetails.currentName;
          req.session.specialNeeds = responseClone.specialNeeds;

          responseClone.eligibilityComplete = isComplete(responseClone.eligibility);
          responseClone.cjsEmployments = response[0].data.cjsEmployment;

          if (responseClone.specialNeeds) {
            responseClone.specialNeeds[0].assistanceType =
              modUtils.reasonsArrToObj(response[1])[responseClone.specialNeeds[0].assistanceType];

            jurorDetails.specialNeeds = responseClone.specialNeeds;
          }

          responseClone.phoneLogs = responseClone.contactLog;
          delete responseClone.contactLog;

          eligibilityDetails = {
            residency: responseClone.eligibility.livedConsecutive,
            mentalHealthAct: responseClone.eligibility.mentalHealthAct,
            mentalHealthCapacity: responseClone.eligibility.mentalHealthCapacity,
            bail: responseClone.eligibility.onBail,
            convictions: responseClone.eligibility.convicted,
          };
          eligibilityDetails.eligible = (
            response[0].data.eligibility.livedConsecutive &&
            (!response[0].data.eligibility.mentalHealthAct && response[0].data.eligibility.mentalHealthAct !== null) &&
            (!response[0].data.eligibility.mentalHealthCapacity &&
              response[0].data.eligibility.mentalHealthCapacity !== null) &&
            (!response[0].data.eligibility.onBail && response[0].data.eligibility.onBail !== null) &&
            (!response[0].data.eligibility.convicted && response[0].data.eligibility.convicted !== null)
          );

          // calculate whether or not a left side nav will have a blue tick
          importantNavItems = {
            jurorDetails: (
              nameDetails.changed ||
              addressDetails.changed ||
              addressDetails.currentAddress?.includes('mod-reply-section__required') ||
              thirdPartyDetails.isThirdParty ||
              jurorDetails.dateOfBirth.ageIneligible === true
            ),
            eligibility: (
              !eligibilityDetails.eligible &&
              !jurorDetails.dateOfBirth.ageIneligible &&
              thirdPartyDetails.reason !== 'Deceased'
            ),
            deferralExcusal: (
              (responseClone.deferral || responseClone.excusal) &&
              thirdPartyDetails.reason !== 'Deceased' &&
              jurorDetails.dateOfBirth.ageIneligible === false
            ),
            cjsEmployment: (
              (responseClone.cjsEmployment && responseClone.cjsEmployment.length > 0) &&
              thirdPartyDetails.reason !== 'Deceased' &&
              jurorDetails.dateOfBirth.ageIneligible === false
            ),
            adjustments: (
              (responseClone.specialNeeds && responseClone.specialNeeds.length > 0) &&
              thirdPartyDetails.reason !== 'Deceased' &&
              jurorDetails.dateOfBirth.ageIneligible === false
            ),
            signature: (
              !response[0].data.signed &&
              !jurorDetails.dateOfBirth.ageIneligible &&
              !jurorDetails.dateOfBirth.ageIneligible
            ),
          };

          responseClone.isLateSummons = responseClone.processingStatus != "Closed" && modUtils.isLateSummons(responseClone.serviceStartDate);
          responseClone.completedAt = responseClone.completed_at;

          req.session.replyDetails = {};
          req.session.replyDetails.jurorNumber = response[0].data.jurorNumber;
          req.session.replyDetails.jurorName = nameDetails.headerNameRender;
          req.session.replyDetails.jurorStartDate = response[0].data.serviceStartDate;
          req.session.replyDetails.isLateSummons = responseClone.isLateSummons;

          // we need to store the location code because we need it to be able to visit the juror record page
          req.session.locCode = modUtils.getCurrentActiveCourt(req, {
            poolNumber: responseClone.poolNumber,
            currentOwner: responseClone.current_owner,
          });

          responseClone.statusRender = response[0].data.jurorStatus;

          return opticReferenceObj.get(
            req,
            req.params['id'],
            jurorDetails.poolNumber,
          )
            .then((opticReference) => getOpticReferenceSuccess(app, req, res, {
              responseClone,
              nameDetails,
              addressDetails,
              jurorDetails,
              eligibilityDetails,
              importantNavItems,
              thirdPartyDetails,
              opticReference,
              processingStatusDisp: resolveProcessingStatusDisplay(responseClone.processingStatus),
            }))
            .catch((err) => getOpticReferenceError(app, req, res, err));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch the paper response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.params['id'],
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('homepage.get'));
        };

      promiseArr.push(paperReplyObj.get(require('request-promise'), app, req.session.authToken, req.params['id']));
      promiseArr.push(systemCodesDAO.get(req, 'REASONABLE_ADJUSTMENTS'));
      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  };

  function getOpticReferenceSuccess(app, req, res, data) {
    app.logger.info('Fetched the optic reference for the juror if available: ', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      data: {
        jurorNumber: req.params['id'],
        opticReference: data.opticReference,
      },
    });

    if (data.responseClone.processingStatus === 'Closed') {
      data.processedBannerMessage = modUtils.resolveProcessedBannerMessage(data.responseClone.jurorStatus, {
        isExcusal: data.responseClone.excusal,
        isDeceased: data.responseClone.excusalReason === 'D',
      });
    }

    const postcode = modUtils.splitPostCode(data.responseClone.addressPostcode);

    if (data.addressDetails.changed &&
      (data.responseClone.existingAddressPostcode !== data.responseClone.addressPostcode &&
        data.responseClone.processingStatus !== 'Closed')) {
      return courtLocationsFromPostcodeObj.get(req, postcode)
        .then(
          (catchmentResponse) => {
            app.logger.info('Fetched the courts for new address: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              postcode: data.responseClone.addressPostcode,
              data: {
                catchmentResponse,
              },
            });

            req.session[`catchmentWarning-${req.params.id}`] = resolveCatchmentResponse(catchmentResponse,
              req.session.locCode);

            return res.render('response/detail', {
              method: req.params['type'] || 'digital',
              displayActionsButtonMenu: true,
              replyType: resolveReplyType(data.responseClone),
              response: data.responseClone,
              nameDetails: data.nameDetails,
              addressDetails: data.addressDetails,
              eligibilityDetails: data.eligibilityDetails,
              jurorDetails: data.jurorDetails,
              importantNavItems: data.importantNavItems,
              processingStatusDisp: data.processingStatusDisp,
              thirdPartyDetails: data.thirdPartyDetails,
              opticReference: data.opticReference,
              processedBannerMessage: data.processedBannerMessage,
              isBureauUser: isBureauUser(req),
              isAddChangeVisible: data.responseClone.processingStatus !== 'Closed',
              catchmentWarning: req.session[`catchmentWarning-${req.params.id}`],
              backLinkUrl: 'inbox.todo.get',
            });

          }
        )
        .catch(
          (err) => {
            app.logger.crit('Failed when fetching the juror\'s catchement area: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: req.params['id'],
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });

            // NO CATCHEMENT AREA FOR POSTCODE
            if (err.statusCode === 404) {
              app.logger.crit('No catchment area for juror\'s postcode: ', {
                auth: req.session.authentication,
                jwt: req.session.authToken,
                data: req.params['id'],
                error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
              });

              req.session[`catchmentWarning-${req.params.id}`] = resolveCatchmentResponse([], req.session.locCode);

              return res.render('response/detail', {
                method: req.params['type'] || 'digital',
                displayActionsButtonMenu: true,
                replyType: resolveReplyType(data.responseClone),
                response: data.responseClone,
                nameDetails: data.nameDetails,
                addressDetails: data.addressDetails,
                eligibilityDetails: data.eligibilityDetails,
                jurorDetails: data.jurorDetails,
                importantNavItems: data.importantNavItems,
                processingStatusDisp: data.processingStatusDisp,
                thirdPartyDetails: data.thirdPartyDetails,
                opticReference: data.opticReference,
                processedBannerMessage: data.processedBannerMessage,
                isBureauUser: isBureauUser(req),
                isAddChangeVisible: data.responseClone.processingStatus !== 'Closed',
                catchmentWarning: req.session[`catchmentWarning-${req.params.id}`],
                backLinkUrl: 'inbox.todo.get',
              });
            }

            return res.redirect(app.namedRoutes.build('homepage.get'));
          }
        );
    }

    return res.render('response/detail', {
      method: req.params['type'] || 'digital',
      displayActionsButtonMenu: true,
      replyType: resolveReplyType(data.responseClone),
      response: data.responseClone,
      nameDetails: data.nameDetails,
      addressDetails: data.addressDetails,
      eligibilityDetails: data.eligibilityDetails,
      jurorDetails: data.jurorDetails,
      importantNavItems: data.importantNavItems,
      processingStatusDisp: data.processingStatusDisp,
      thirdPartyDetails: data.thirdPartyDetails,
      opticReference: data.opticReference,
      processedBannerMessage: data.processedBannerMessage,
      isAddChangeVisible: data.responseClone.processingStatus !== 'Closed',
      isBureauUser: isBureauUser(req),
      backLinkUrl: 'inbox.todo.get',
    });
  }

  function getOpticReferenceError(app, req, res, err) {

    app.logger.crit('Failed when fetching the juror\'s optic reference: ', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      data: req.params['id'],
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });

    return res.redirect(app.namedRoutes.build('homepage.get'));
  }

  module.exports.getCheckCanAccommodate = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors)
        , cancelUrl;

      delete req.session.errors;
      delete req.session.formFields;

      cancelUrl = modUtils
        .opticReferenceRedirectUrl(req.params['id'], app.namedRoutes, req.session.jurorDetails.replyType);

      return res.render('summons-management/_common/check-can-accommodate', {
        jurorNumber: req.params['id'],
        jurorDetails: req.session.jurorDetails,
        cancelUrl,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postCheckCanAccommodate = function(app) {
    return function(req, res) {
      var validatorResult
        , successCB = function() {

          app.logger.info('Posted a new Optic reference: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
          });

          return res.redirect(modUtils
            .opticReferenceRedirectUrl(req.params['id'], app.namedRoutes, req.session.jurorDetails.replyType));
        }
        , errorCB = function(err) {

          app.logger.crit('Something went wrong when adding the optic reference: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('homepage.get'));
        };

      validatorResult = validate(req.body, opticReferenceValidator.opticReferenceAdd());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('response.check-can-accommodate.get', {
          id: req.params['id'],
        }));
      }

      opticReferenceObj.post(
        req,
        req.body,
        req.params['id'],
        req.session.jurorDetails.poolNumber,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getViewJurorRecord = function(app) {
    return function(req, res) {
      req.session.isJurorSearchResult = true;
      return res.redirect(app.namedRoutes.build('juror-record.search.get') + `?jurorNumber=${req.params.id}`);
    }
  }

  // Helper functions
  function isComplete(elements) {
    var el;
    for (el in elements) {
      if (el === 'address') {
        const address = elements[el];
        let line;
        for (line in address) {
          if (address[line] === null || typeof address[line] === 'undefined' || address[line] === '') return false;
        }
      } else {
        if (elements[el] === null || typeof elements[el] === 'undefined') return false;
      }
    }
    

    return true;
  }

  // taken from the original response -> detail.controller.js
  function resolveJurorName(response) {
    var newNameRender = [response.title, response.firstName, response.lastName]
        .filter(function(val) {
          return val;
        }).join(' ')
      , nameRender = [response.existingTitle, response.existingFirstName, response.existingLastName]
        .filter(function(val) {
          return val;
        }).join(' ')
      , hasNewName = newNameRender !== nameRender;

    return {
      changed: (hasNewName === true),
      currentName: (hasNewName) ? newNameRender : nameRender,
      oldName: (hasNewName) ? nameRender : null,
      headerNameRender: (hasNewName) ? newNameRender : nameRender,
      title: (hasNewName) ? response.title : response.existingTitle,
      firstName: (hasNewName) ? response.firstName : response.existingFirstName,
      lastName: (hasNewName) ? response.lastName : response.existingLastName,
    };
  }

  // also taken from response -> detail.controller.js
  function resolveJurorAddress(response) {
    var newAddressRender = filters.buildSummonsAddress([
        response.addressLineOne,
        response.addressLineTwo,
        response.addressLineThree,
        response.addressTown,
        response.addressCounty,
        response.addressPostcode,
        '',
      ])
      , addressRender = filters.buildSummonsAddress([
        response.existingAddressLineOne,
        response.existingAddressLineTwo,
        response.existingAddressLineThree,
        response.existingAddressTown,
        response.existingAddressCounty,
        response.existingAddressPostcode,
        '',
      ])
      , hasNewAddress = newAddressRender !== addressRender;

    return {
      changed: (hasNewAddress === true),
      currentAddress: (hasNewAddress) ? newAddressRender : addressRender,
      oldAddress: (hasNewAddress) ? addressRender : null,

      address1: (hasNewAddress) ? response.addressLineOne : response.existingAddressLineOne,
      address2: (hasNewAddress) ? response.addressLineTwo : response.existingAddressLineTwo,
      address3: (hasNewAddress) ? response.addressLineThree : response.existingAddressLineThree,
      address4: (hasNewAddress) ? response.addressTown : response.existingAddressTown,
      address5: (hasNewAddress) ? response.addressCounty : response.existingAddressCounty,
      address6: (hasNewAddress) ? response.addressPostcode : response.existingAddressPostcode,
    };
  }

  function resolveJurorDob(response) {
    var newDateOfBirth = response.dateOfBirth
      , currentAge = moment(response.serviceStartDate, 'YYYY-MM-DD')
        .diff(moment(response.dateOfBirth, 'YYYY-MM-DD'), 'years');

    return {
      changed: false,
      current: newDateOfBirth,
      currentAge: currentAge,
      ageIneligible: currentAge < 18 || currentAge > 75,
    };
  }

  function resolveJurorEmail(response) {
    var newEmailAddress = response.emailAddress;

    return {
      changed: false,
      current: newEmailAddress,
    };
  }

  function resolveThirdParty(response) {
    var isThirdParty = response.thirdParty.relationship !== null && response.thirdParty.thirdPartyReason !== null;

    return {
      isThirdParty: isThirdParty,
      relationship: response.thirdParty.relationship,
      reason: response.thirdParty.thirdPartyReason,
    };
  }

  function resolveReplyType(response) {
    if (response.thirdParty.thirdPartyReason !== null) {
      if (response.processingStatus === 'CLOSED' && response.thirdParty.thirdPartyReason === 'Deceased') {
        return 'DECEASED';
      }
    }

    if (!response.jurorDetailsComplete || !response.eligibilityComplete || !response.signed) {
      return 'INELIGIBLE';
    }

    if (!response.eligibility.livedConsecutive
      || response.eligibility.mentalHealthAct
      || response.eligibility.mentalHealthCapacity
      || response.eligibility.onBail
      || response.eligibility.convicted) {
      return 'INELIGIBLE';
    }

    if (typeof response.deferral !== 'undefined' && response.deferral) {
      return 'DEFERRAL';
    }

    if (typeof response.excusal !== 'undefined' && response.excusal) {
      if (response.excusalReason === 'D') return 'DECEASED';

      return 'EXCUSAL';
    }

    return 'NEEDS REVIEW';
  }

  function resolveProcessingStatusDisplay(status) {
    let resolvedStatus = status;

    switch (status) {
    case 'Closed':
      resolvedStatus = 'Completed';
      break;
    case 'Awaiting Court':
      resolvedStatus = 'Awaiting court reply';
      break;
    case 'Awaiting Juror':
      resolvedStatus = 'Awaiting juror info';
      break;
    }

    return resolvedStatus;
  }

  function createDeferralDate(deferredToDate) {
    let [day, month, year] = deferredToDate.split('/')
      , intDay = parseInt(day), intMonth = parseInt(month), intYear = parseInt(year)
      , date = new Date(intYear, intMonth - 1, intDay, 12, 0, 0);  // Date takes a 0-11 month range, set to midday

    return date;
  }

  function resolveCatchmentResponse(courtsInCatchment, currentLocationCode) {
    let catchment = {
      currentLocationCode: currentLocationCode,
      isOutwithCatchment: true,
      courts: [],
    };

    for (let court of courtsInCatchment) {
      if (court.locationCode === currentLocationCode) {
        catchment.isOutwithCatchment = false;
      }
      if (court.locationCode !== '400') {
        court.formattedName = modUtils.transformCourtName(court);
        catchment.courts.push(court);
      }
    }

    return catchment;
  };

  module.exports.resolveCatchmentResponse = resolveCatchmentResponse;

})();
