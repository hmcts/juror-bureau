/**
 * Using Rails-like standard naming convention for endpoints.
 * GET    /    ->    index
 */

;(function(){
  'use strict';

  var moment = require('moment')
    , validate = require('validate.js')
    , _ = require('lodash')
    , pdfMake = require('pdfmake')
    , modUtils = require('../../../lib/mod-utils')
    , responseDetailObj = require('../../../objects/response-detail').object
    , notesDetailObj = require('../../../objects/response-detail').object
    , disqualifyObj = require('../../../objects/disqualify').object
    , excusalObj = require('../../../objects/excusal').object
    , deferralObj = require('../../../objects/deferral').object
    , sendCourtObj = require('../../../objects/send-court').object
    , courtObj = require('../../../objects/court').object
    , pdfExport = require('../../../lib/pdfExport')
    , englishLanguageText = require('../../../../client/js/i18n/en/PDF.json')
    , welshLanguageText = require('../../../../client/js/i18n/cy/PDF.json')
    , paperUpdateStatus = require('../../../objects/summons-management').updateStatus
    , opticReferenceObj = require('../../../objects/juror-record').opticReferenceObject
    , { systemCodesDAO } = require('../../../objects/administration')
    , { dateFilter } = require('../../../components/filters')
    , jurorRecordObject = require('../../../objects/juror-record');

  const { courtLocationsFromPostcodeObj } = require('../../../objects/court-location.js');
  const { resolveCatchmentResponse } = require('../../summons-management/summons-management.controller.js');
  const { updateStatusDAO } = require('../../../objects');

  module.exports.index = function(app) {
    return function(req, res) {
      var promiseArr = []

        , successCB = function(response) {
          var data = response.results[0]
            , catchmentStatus = response.results[1].status
            , nameDetails = getNameDetails(data)
            , addressDetails = getAddressDetails(data)
            , additionalChangeDetails = getAdditionalChangedDetails(data)
            , eligibilityDetails = getEligibilityDetails(data)
            , thirdPartyDetails = getThirdPartyDetails(data)
            , canEdit = (
              data.processingStatus !== 'CLOSED' && data.superUrgent !== true
            )
            , poolStatus
            , processingStatus
            , renderPage
            , responseCompletedMesssage


            // Calculate which sub-nav items are highlighted for importance
            , importantNavItems = {
              jurorDetails: (
                nameDetails.changed ||
                addressDetails.changed ||
                thirdPartyDetails.isThirdParty ||
                additionalChangeDetails.ageIneligible === true ||
                additionalChangeDetails.hasChange === true
              ),

              eligibility: (
                !eligibilityDetails.eligible &&
                thirdPartyDetails.reason !== 'Deceased' &&
                additionalChangeDetails.ageIneligible === false
              ),
              deferralExcusal: (
                (data.deferralReason || data.excusalReason) &&
                thirdPartyDetails.reason !== 'Deceased' &&
                additionalChangeDetails.ageIneligible === false
              ),
              cjsEmployment: (
                (data.cjsEmployments && data.cjsEmployments.length > 0) &&
                thirdPartyDetails.reason !== 'Deceased' &&
                additionalChangeDetails.ageIneligible === false
              ),
              adjustments: (
                (data.specialNeedsArrangements || (data.specialNeeds && data.specialNeeds.length > 0)) &&
                thirdPartyDetails.reason !== 'Deceased' &&
                additionalChangeDetails.ageIneligible === false
              ),
            };

          if (additionalChangeDetails.altPhone.current.length === 0 && data.processingStatus === 'CLOSED') {
            additionalChangeDetails.altPhone.current = data.newAltPhoneNumber;
          }

          app.logger.info('Fetched and parsed single response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            response: data,
          });

          // clear out jurorDetails sessions and reload, this is for the check-can-accommodate page
          req.session.jurorDetails = {
            name: nameDetails,
            phone: {
              current: additionalChangeDetails.phone.current,
            },
            email: {
              current: additionalChangeDetails.email.current,
            },
            poolNumber: data.poolNumber,
            replyType: 'digital',
            specialNeeds: data.specialNeeds.length > 0 ? [{
              assistanceType: modUtils.reasonsArrToObj(response.results[2])[data.specialNeeds[0].code],
              assistanceTypeDetails: data.specialNeedsArrangements || data.specialNeeds[0].detail,
            }] : [],
          };

          // store juror details in session
          req.session.replyDetails = {};
          req.session.replyDetails.jurorNumber = data.jurorNumber;
          req.session.replyDetails.jurorName = nameDetails.headerNameRender;
          req.session.replyDetails.version = data.version;
          req.session.replyDetails.jurorStartDate = data.poolDate;

          // we get a unix timestamp with this journey... maybe it gets good when both records are merged into 1
          data.isLateSummons = data.processingStatus != "CLOSED" && modUtils.isLateSummons(dateFilter(data.poolDate, 'DD/MM/YYYY', 'YYYY-MM-DD'));
          req.session.replyDetails.isLateSummons = data.isLateSummons;

          // too much... so maybe I should extract to a builder function
          req.session.editableReplyDetails = {};
          req.session.editableReplyDetails.title = data.title;
          req.session.editableReplyDetails.firstName = data.firstName;
          req.session.editableReplyDetails.lastName = data.lastName;
          req.session.editableReplyDetails.address = {
            part1: data.jurorAddress1,
            part2: data.jurorAddress2,
            part3: data.jurorAddress3,
            part4: data.jurorAddress4,
            part5: data.jurorAddress5,
            part6: data.jurorAddress6,
          };
          req.session.editableReplyDetails.postcode = data.jurorPostcode;
          req.session.editableReplyDetails.dateOfBirth = data.dateOfBirth;
          req.session.editableReplyDetails.primaryPhone = data.phoneNumber;
          req.session.editableReplyDetails.secondaryPhone = data.altPhoneNumber;
          req.session.editableReplyDetails.emailAddress = data.email;
          req.session.editableReplyDetails.thirdParty = {
            relationship: data.thirdPartyRelationship,
            reason: data.thirdPartyReason,
          };

          req.session.awaitingInformation = {};
          req.session.awaitingInformation.required = false;
          req.session.awaitingInformation.cancelUrl = undefined;

          req.session.locCode = modUtils.getCurrentActiveCourt(req, {
            poolNumber: data.poolNumber,
            currentOwner: data.currentOwner,
          });

          // check POOL status against RESPONSE status
          poolStatus = data.status;
          processingStatus = data.processingStatus;
          renderPage = 'detail';

          if (poolStatus && processingStatus === 'TODO'  && poolStatus === 11){
            renderPage = 'awaiting-information';
            req.session.awaitingInformation.required = true;
            req.session.awaitingInformation.cancelUrl = req.session.sourceUrl;
          };

          if (renderPage === 'awaiting-information'){
            return res.render('response/process/awaiting-information.njk', {
              awaitingInformationDetails: undefined,
              awaitingInformationUpdate: req.session.awaitingInformation,
              replyDetails: req.session.replyDetails,
              jurorNumber: req.params.id,
              //updateRequired: true,
              //cancelUrl: req.session.sourceUrl,
              errors: {
                message: '',
                count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
                items: undefined,
              },
            });
          }

          data.phoneLogs = response.results[3].data.contactLogs;

          return opticReferenceObj.get(
            req,
            data.jurorNumber,
            data.poolNumber,
          )
            .then((opticReference) => {

              // for now we only log this if the user has mod access
              if (req.session.hasModAccess) {
                app.logger.info('Fetched the optic reference for the juror if available: ', {
                  auth: req.session.authentication,
                  jwt: req.session.authToken,
                  data: {
                    jurorNumber: req.params['id'],
                    opticReference: opticReference,
                  },
                });

                if (data.newJurorPostcode !== data.jurorPostcode && data.processingStatus !== 'Closed') {
                  const postcode = modUtils.splitPostCode(data.newJurorPostcode);

                  return courtLocationsFromPostcodeObj.get(
                    require('request-promise'),
                    app,
                    req.session.authToken,
                    postcode
                  )
                    .then(
                      (catchmentResponse) => {
                        app.logger.info('Fetched the courts for new address: ', {
                          auth: req.session.authentication,
                          jwt: req.session.authToken,
                          postcode: data.newJurorPostcode,
                          data: {
                            catchmentResponse,
                          },
                        });

                        req.session[`catchmentWarning-${req.params.id}`] = resolveCatchmentResponse(catchmentResponse,
                          req.session.locCode);

                        return res.render('response/detail.njk', {
                          response: data,
                          nameDetails: nameDetails,
                          addressDetails: addressDetails,
                          jurorDetails: additionalChangeDetails,
                          thirdPartyDetails: thirdPartyDetails,
                          logAttention: ((data.notes !== null && data.notes.length > 0) || data.phoneLogs.length > 0),
                          dateConfirmed: (!data.excusalReason && !data.deferralReason),
                          importantNavItems: importantNavItems,
                          eligibilityDetails: eligibilityDetails,
                          isDeceased: thirdPartyDetails.reason === 'Deceased',
                          adjustmentsHasFlag: data.specialNeeds.length > 0 && thirdPartyDetails.reason !== 'Deceased',
                          assignedSelf: !(
                            data.assignedStaffMember === null ||
                              data.assignedStaffMember.login === null ||
                              data.assignedStaffMember.login !== req.session.authentication.login
                          ),
                          nav: req.session.nav,
                          canEdit: canEdit,
                          poolStatus: data.status,
                          processingStatus: data.processingStatus,
                          processingStatusDisp: getProcessingStatusDisplay(data.processingStatus, req.session.hasModAccess),
                          displayProcessButtonMenu: (data.processingStatus !== 'CLOSED'),
                          displayActionsButtonMenu: true,
                          replyType: getReplyType(data, req.session.hasModAccess),
                          errors: {
                            count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
                            items: req.session.errors,
                          },
                          opticReference,
                          processedBannerMessage: data.processedBannerMessage ? data.processedBannerMessage : null,
                          catchmentWarning: req.session[`catchmentWarning-${req.params.id}`],
                          backLinkUrl: 'inbox.todo.get',
                        });
                      }
                    )
                    .catch(
                      (err) => {
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
                            response: data,
                            nameDetails: nameDetails,
                            addressDetails: addressDetails,
                            jurorDetails: additionalChangeDetails,
                            thirdPartyDetails: thirdPartyDetails,
                            logAttention: ((data.notes !== null && data.notes.length > 0) || data.phoneLogs.length > 0),
                            dateConfirmed: (!data.excusalReason && !data.deferralReason),
                            importantNavItems: importantNavItems,
                            eligibilityDetails: eligibilityDetails,
                            isDeceased: thirdPartyDetails.reason === 'Deceased',
                            adjustmentsHasFlag: data.specialNeeds.length > 0 && thirdPartyDetails.reason !== 'Deceased',
                            assignedSelf: !(
                              data.assignedStaffMember === null ||
                              data.assignedStaffMember.login === null ||
                              data.assignedStaffMember.login !== req.session.authentication.login
                            ),
                            nav: req.session.nav,
                            canEdit: canEdit,
                            poolStatus: data.status,
                            processingStatus: data.processingStatus,
                            processingStatusDisp: getProcessingStatusDisplay(data.processingStatus, req.session.hasModAccess),
                            displayProcessButtonMenu: (data.processingStatus !== 'CLOSED'),
                            displayActionsButtonMenu: true,
                            replyType: getReplyType(data, req.session.hasModAccess),
                            errors: {
                              count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
                              items: req.session.errors,
                            },
                            opticReference,
                            processedBannerMessage: data.processedBannerMessage ? data.processedBannerMessage : null,
                            catchmentWarning: req.session[`catchmentWarning-${req.params.id}`],
                            backLinkUrl: 'inbox.todo.get',
                          });
                        }

                        app.logger.crit('Failed when fetching the juror\'s catchement area: ', {
                          auth: req.session.authentication,
                          jwt: req.session.authToken,
                          data: req.params['id'],
                          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
                        });

                        return res.redirect(app.namedRoutes.build('homepage.get'));
                      }
                    );

                }

                if (data.processingStatus === 'CLOSED') {
                  data.processedBannerMessage = modUtils.resolveProcessedBannerMessage(data.statusRender, {
                    isExcusal: !!data.excusalReason,
                    isDeceased: data.thirdPartyReason === 'deceased' || data.excusalReason === 'D',
                  });
                }
              }
              
              if (req.session.responseCompletedMesssage) {
                responseCompletedMesssage = req.session.responseCompletedMesssage;
                delete req.session.responseCompletedMesssage;
              } else {
                responseCompletedMesssage = null;
              }
              
              return res.render('response/detail.njk', {
                response: data,
                nameDetails: nameDetails,
                addressDetails: addressDetails,
                jurorDetails: additionalChangeDetails,
                thirdPartyDetails: thirdPartyDetails,
                logAttention: ((data.notes !== null && data.notes.length > 0) || data.phoneLogs.length > 0),
                dateConfirmed: (!data.excusalReason && !data.deferralReason),
                importantNavItems: importantNavItems,
                eligibilityDetails: eligibilityDetails,
                isDeceased: thirdPartyDetails.reason === 'Deceased',
                adjustmentsHasFlag: data.specialNeeds.length > 0 && thirdPartyDetails.reason !== 'Deceased',
                assignedSelf: !(
                  data.assignedStaffMember === null ||
                  data.assignedStaffMember.login === null ||
                  data.assignedStaffMember.login !== req.session.authentication.login
                ),

                nav: req.session.nav,
                canEdit: canEdit,
                poolStatus: data.status,
                processingStatus: data.processingStatus,
                processingStatusDisp: getProcessingStatusDisplay(data.processingStatus, req.session.hasModAccess),
                displayProcessButtonMenu: (data.processingStatus !== 'CLOSED'),
                displayActionsButtonMenu: true,
                replyType: getReplyType(data, req.session.hasModAccess),

                errors: {
                  count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
                  items: req.session.errors,
                },

                opticReference,
                processedBannerMessage: data.processedBannerMessage ? data.processedBannerMessage : null,
                responseCompletedMesssage: responseCompletedMesssage,
                method: 'digital',
                backLinkUrl: 'inbox.todo.get',
              });
            });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch and parse single response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('index.njk');
        };

      delete req.session[`catchmentWarning-${req.params.id}`];
      delete req.session.requestInfo;
      req.session.replyDetails = {};
      req.session.editableReplyDetails = {};

      promiseArr.push(
        responseDetailObj.get(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params.id,
          req.session.hasModAccess
        )
      );
      promiseArr.push(
        courtObj.getCatchmentStatus(require('request-promise'), app, req.session.authToken, req.params.id));
      promiseArr.push(
        systemCodesDAO.get(req, 'REASONABLE_ADJUSTMENTS'));
      promiseArr.push(
        jurorRecordObject.record.get(
          req,
          'contact-log',
          req.params['id'],
        ),
      );

      executeAllPromises(promiseArr)
        .then(successCB)
        .catch(errorCB);

    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Updated status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.body.jurorNumber,
              processingStatus: req.body.processingStatus,
              version: req.body.version,
            },
            response: response,
          });

          return res.redirect(app.namedRoutes.build('inbox.todo.get'));
        }
        , errorCB = function(err) {
          var errorMsg = 'Could not update status of response.';

          app.logger.crit('Could not update status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.body.jurorNumber,
              processingStatus: req.body.processingStatus,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === '409' || err.statusCode === 409) {
            // eslint-disable-next-line
            errorMsg = 'The Juror Digital response that you are trying to update has been updated by someone else since you started this process. Please check the updated values and reapply your changes if necessary.';
          } else if (err.statusCode === '400') {
            errorMsg = 'The Juror Digital response that you are trying to update has already been updated.';
          }

          req.session.errors = {
            processingStatus: [{
              summary: errorMsg,
              details: errorMsg,
            }],
          };

          return res.redirect(app.namedRoutes.build('response.detail.get', {
            id: req.body.jurorNumber,
          }));
        };

      // Remove errors each time
      delete req.session.errors;

      const payload = {
        jurorNumber: req.body.jurorNumber,
        status: req.body.processingStatus,
        version: req.body.version,
      };

      updateStatusDAO.post(req, payload, req.body.jurorNumber)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getNotes = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Fetched notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
            },
            response: response,
          });

          return res.status(200).json(response);
        }
        , errorCB = function(err) {
          app.logger.crit('Could not fetch notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              body: req.body,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send(err.error);
        };

      responseDetailObj
        .getNotes(require('request-promise'), app, req.session.authToken, req.params.id)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postNotes = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Updated notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              notes: req.body.notes,
              version: req.body.version,
            },
            response: response,
          });

          return res.status(204).send(response);
        }
        , errorCB = function(err) {
          app.logger.crit('Could not update notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              notes: req.body.notes,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send(err.error);
        };

      responseDetailObj
        .putNotes(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params.id,
          req.body.notes,
          req.body.version
        )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getEditNotes = function(app) {
    return function(req, res) {
      var jurorName
        , tmpErrors

        , notesSuccessCB = function(response) {

          app.logger.info('Fetched notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
            },
            response: response,
          });

          req.session.replyDetails.notes = response.notes;
          req.session.replyDetails.notesVersion = response.version;

          return res.render('response/notes-edit.njk', {
            response: response,
            notesText: response.notes,
            notesVersion: response.version,
            jurorName: jurorName,
            jurorNumber: req.params.id,
            errors: {
              title: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });

        }
        , notesErrorCB = function(err) {
          app.logger.crit('Could not fetch notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              body: req.body,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send(err.error);
        };

      // store errors and clear from session
      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      if (req.session.replyDetails){
        jurorName = req.session.replyDetails.jurorName;
      }

      if (tmpErrors){
        return res.render('response/notes-edit.njk', {
          response: null,
          jurorNumber: req.params.id,
          jurorName: jurorName,
          notesText: req.session.replyDetails.notes,
          notesVersion: req.session.replyDetails.notesVersion,
          errors: {
            title: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      }

      notesDetailObj
        .getNotes(require('request-promise'), app, req.session.authToken, req.params.id)
        .then(notesSuccessCB)
        .catch(notesErrorCB);

    };
  };

  module.exports.postEditNotes = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Updated notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              notes: req.body.notes,
              version: req.body.version,
            },
            response: response,
          });

          return res.redirect('/response/' + req.params.id + '#logContent');

        }
        , errorCB = function(err) {
          app.logger.crit('Could not update notes of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              notes: req.body.notes,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          //return res.status(err.statusCode).send(err.error);
          if (err.statusCode === 409){
            req.session.errors = {
              notes: [{
                details: 'The notes have been updated by someone else',
                summary: 'The notes have been updated by someone else',
              }],
            };

            return res.redirect(app.namedRoutes.build('response.detail.notes.edit.get', {id: req.body.jurorNumber}));
          }

          return res.render('response/notes-edit.njk', {
            response: null,
            notesText: req.session.replyDetails.notes,
            notesVersion: req.session.replyDetails.notesVersion,
            jurorName: req.session.replyDetails.jurorName,
            jurorNumber: req.params.id,
            errors: {
              title: '',
              count: 1,
              message: 'Could not update notes of response',
            },
          });

        },
        validatorResult,
        notesText = req.body.notes;

      // Store notes
      req.session.replyDetails.notes = req.body.notes;

      // Reset errors
      delete req.session.errors;

      // Validate form submission
      validatorResult = validate(req.body, require('../../../config/validation/notes.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('response.detail.notes.edit.get', {id: req.body.jurorNumber}));
      }

      responseDetailObj
        .putNotes(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params.id,
          notesText,
          req.body.notesVersion
        )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getCallLog = function(app) {
    return function(req, res) {
      var tmpErrors
        , jurorName
        , callNotes;

      if (req.session.replyDetails){
        jurorName = req.session.replyDetails.jurorName;
        if (req.session.replyDetails.callNotes){
          callNotes = req.session.replyDetails.callNotes;
        }
      }

      // store errors and clear from session
      tmpErrors = _.cloneDeep(req.session.errors);
      delete req.session.errors;
      delete req.session.formFields;

      return res.render('response/call-log.njk', {
        response: null,
        callNotes: callNotes,
        jurorNumber: req.params.id,
        jurorName: jurorName,
        errors: {
          title: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });

    };
  };

  module.exports.postCallLog = function(app) {
    return function(req, res) {
      var validatorResult

        , successCB = function(response) {
          app.logger.info('Created phone log entry for response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              notes: req.body.callNotes,
            },
            response: response,
          });

          //return res.status(204).send();
          return res.redirect('/response/' + req.params.id + '#callLog');
        }

        , errorCB = function(err) {
          app.logger.crit('Could not create phone log entry for response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              notes: req.body.callNotes,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          //return res.status(err.statusCode).send(err.error);

          return res.render('response/call-log.njk', {
            response: null,
            callNotes: req.session.replyDetails.callNotes,
            jurorNumber: req.params.id,
            jurorName: req.session.replyDetails.jurorName,
            errors: {
              title: '',
              count: 1,
              message: 'Could not create phone log entry for response',
            },
          });

        };

      // Store notes
      req.session.replyDetails.callNotes = req.body.callNotes;

      // Validate input
      validatorResult = validate(req.body, require('../../../config/validation/phone-log.js')(req));
      if (typeof validatorResult !== 'undefined') {

        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('response.detail.call-log.get', {id: req.body.jurorNumber}));
      }

      responseDetailObj
        .postPhoneLog(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params.id,
          req.body.callNotes
        )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getDisqualify = function(app) {
    return function(req, res) {
      var successCB = function(disqualifyReasons) {
          var tmpErrors
            , tmpFields;

          app.logger.info('Fetched list of disqualify reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            reasons: disqualifyReasons,
          });

          tmpErrors = _.cloneDeep(req.session.errors);
          tmpFields = _.cloneDeep(req.session.formFields);
          delete req.session.formFields;
          delete req.session.errors;

          disqualifyReasons = _.sortBy(disqualifyReasons, 'disqualifyCode');

          if (req.session.replyDetails.jurorNumber === req.params.id){
            return res.render('response/process/disqualify.njk', {
              disqualifyReasons: disqualifyReasons,
              disqualifyDetails: tmpFields,
              replyDetails: req.session.replyDetails,
              jurorNumber: req.params.id,
              errors: {
                message: '',
                count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
                items: tmpErrors,
              },
            });
          }

          return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));


        }

        , errorCB = function(err) {
          var tmpErrors;

          app.logger.crit('Failed to fetch list of disqualify reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          tmpErrors = {
            '': [{'details': 'Failed to fetch list of disqualify reasons'}],
          };

          return res.render('index.njk', {
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });

        };

      disqualifyObj.get(require('request-promise'), app, req.session.authToken)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postDisqualify = function(app) {
    return function(req, res) {
      var validatorResult

        , successCB = function(response) {
          app.logger.info('Set response as disqualified: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              code: req.body.code,
              version: req.body.version,
            },
            response: response,
          });

          return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));
        }

        , errorCB = function(err) {
          app.logger.crit('Could not set response as disqualified: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              code: req.body.code,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === '409' || err.statusCode === 409) {
            // eslint-disable-next-line
            err.error.message = 'The summons reply has been updated by another user';
          } else {
            err.error.message = 'Could not update summons reply';
          }

          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': err.error.message}],
          };

          return res.redirect(app.namedRoutes.build('response.detail.disqualify.get', {id: req.params.id}));
        };


      // Validate input
      validatorResult = validate(req.body, require('../../../config/validation/disqualify.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        //return res.status(400).json(validatorResult);
        return res.redirect(app.namedRoutes.build('response.detail.disqualify.get', {id: req.params.id}));
      }

      // Send to API
      disqualifyObj.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.id,
        req.body.version,
        req.body.disqualifyReason
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getExcusal = function(app) {
    return function(req, res) {
      var promiseArr = []
        , tmpErrors
        , tmpFields

        , successCB = function(data) {
          app.logger.info('Fetched list of excusal reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            reasons: data[0],
          });

          tmpFields = _.cloneDeep(req.session.formFields);
          tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          //return res.render('response/_modals/excusal.njk', {
          return res.render('response/process/excusal.njk', {
            excusalDetails: tmpFields,
            excusalReasons: data[0],
            nameDetails: getNameDetails(data[1]),
            jurorNumber: req.params.id,
            version: data[1].version,
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of excusal reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('index.njk');
        };

      promiseArr.push(systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL'));
      promiseArr.push(responseDetailObj.get(require('request-promise'), app, req.session.authToken, req.params.id));
      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  };




  module.exports.postExcusal = function(app) {
    return function(req, res) {
      var validatorResult
        , acceptExcusal = req.body['excusalDecision'] === 'acceptExcusal'
        , refuseExcusal = req.body['excusalDecision'] === 'refuseExcusal'

        , successCB = function(response) {
          app.logger.info('Accepted response excusal request: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              version: req.body.version,
              excusalCode: req.body.code,
            },
            response: response,
          });

          //return res.status(204).send();
          return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));

        }

        , errorCB = function(err) {
          var messageText = '';

          app.logger.crit('Could not accept response excusal request: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              version: req.body.version,
              excusalCode: req.body.code,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (parseInt(err.statusCode, 10) === 400) {
            messageText = 'The summons has been completed by another user. Your changes will not be saved.';
          } else {
            messageText = 'Could not update response';
          }

          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': messageText}],
          };

          //return res.status(err.statusCode).send(err.error);
          return res.redirect(app.namedRoutes.build('response.detail.excusal.get', {id: req.params.id}));
        };

      delete req.session.errors;
      delete req.session.formFields;

      // Validate input
      validatorResult = validate(req.body, require('../../../config/validation/excusal.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        //return res.status(400).json(validatorResult);
        return res.redirect(app.namedRoutes.build('response.detail.excusal.get', {id: req.params.id}));
      }


      // Send to API

      if (acceptExcusal){
        excusalObj.accept(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params.id,
          req.body.version,
          req.body.excusalCode
        )
          .then(successCB)
          .catch(errorCB);

      }

      if (refuseExcusal){
        excusalObj.reject(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params.id,
          req.body.version,
          req.body.excusalCode
        )
          .then(successCB)
          .catch(errorCB);

      }
    };
  };

  module.exports.getDeferral = function(app) {
    return function(req, res) {
      var promiseArr = []
        , tmpErrors
        , tmpFields
        , deferralDates
        , defaultDate

        , successCB = function(data) {
          app.logger.info('Fetched list of deferral reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
              deferralDates: data[1].deferralDate,
            },
            reasons: data[0],
          });

          tmpFields = _.cloneDeep(req.session.formFields);
          tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          deferralDates = getDeferralDatesArray(data[1].deferralDate);
          if (deferralDates.length > 0) {
            defaultDate = deferralDates[0].displayValue;
          } else {
            defaultDate = moment().format('D MMMM YYYY');
          }

          //return res.render('response/_modals/deferral.njk', {
          return res.render('response/process/deferral.njk', {
            deferralDetails: tmpFields,
            deferralReasons: data[0],
            deferralDates: deferralDates,
            defaultDate: defaultDate,
            nameDetails: getNameDetails(data[1]),
            jurorNumber: req.params.id,
            version: data[1].version,
            hearingDate: data[1].hearingDate,
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of deferral reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('index.njk');
        };

      promiseArr.push(systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL'));
      promiseArr.push(responseDetailObj.get(require('request-promise'), app, req.session.authToken, req.params.id));
      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);

    };
  };

  module.exports.postDeferral = function(app) {
    return function(req, res) {
      var validatorResult
        , deferralDate = null
        , acceptDeferral = req.body['deferralDecision'] === 'acceptDeferral'
        , successCB = function(response) {
          app.logger.info((acceptDeferral ? 'Accepted' : 'Rejected') + ' response deferral request: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              version: req.body.version,
              acceptDeferral: req.body.acceptDeferral,
              deferralDate: req.body.deferralDate,
              deferralReason: req.body.deferralReason,
            },
            response: response,
          });

          //return res.status(204).send();
          return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));
        }
        , errorCB = function(err) {
          if (err.statusCode === 422 && err.error?.code === 'CANNOT_DEFER_TO_EXISTING_POOL') {
            app.logger.crit('Failed to process Deferral - cannot add to existing pool: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: req.body,
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });
    
            req.session.errors = modUtils.makeManualError('deferralDate', 'You cannot defer into the juror\'s existing pool - please select a different pool or date');
            req.session.deferralSelectedReason = req.body.deferralReason;
            req.session.formFields = req.body;
            return res.redirect(app.namedRoutes.build('response.detail.deferral.get',
              { id: req.params.id })
            );
          }

          var messageText = '';

          app.logger.crit('Could not ' + (acceptDeferral ? 'accept' : 'reject') +  + ' response deferral request: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              version: req.body.version,
              acceptDeferral: req.body.acceptDeferral,
              deferralDate: req.body.deferralDate,
              deferralReason: req.body.deferralReason,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (parseInt(err.statusCode, 10) === 400) {
            messageText = 'The summons has been completed by another user. Your changes will not be saved.';
          } else {
            messageText = 'Could not update response';
          }

          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': messageText}],
          };

          return res.redirect(app.namedRoutes.build('response.detail.deferral.get', {id: req.params.id}));
        };


      if (acceptDeferral){
        if (req.body.deferralDateSelection === 'otherDate'){
          // other date selected
          deferralDate = req.body.deferralDate;
        } else {
          // juror date selected
          deferralDate = req.body.deferralDateSelection;
        }
      } else {
        req.body.deferralDateSelection = '';
        deferralDate = '';
      }
      req.body.deferralDate = deferralDate;

      delete req.session.errors;
      delete req.session.formFields;

      // Validate input
      validatorResult = validate(req.body, require('../../../config/validation/deferral.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        //return res.status(400).json(validatorResult);
        return res.redirect(app.namedRoutes.build('response.detail.deferral.get',
          {id: req.params.id})
        );
      }

      // Send to API
      deferralObj.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.id,
        req.body.version,
        acceptDeferral,
        acceptDeferral ? moment(req.body.deferralDate, 'DD/MM/YYYY').format() : null,
        req.body.deferralReason
      )
        .then(successCB)
        .catch(errorCB);

    };
  };

  module.exports.getDownloadPDF = function(app) {
    return function(req, res) {

      var successData = function(responseData){

        var pdfDoc
          , fonts = {
            OpenSans: {
              normal: './client/assets/fonts/OpenSans-Regular.ttf',
              bold: './client/assets/fonts/OpenSans-Bold.ttf',
            },
          }
          , printer
          , jurorData = {}
          , chunks = []
          , result
          , docDef
          , courtDate
          , jurorEligible = false
          , jurorIneligibleAge = false
          , jurorDeceased = false
          , jurorThirdParty = false
          , deferralDate
          , displayDates={}
          , thirdPartyReasonEN = {
            nothere: 'The person isn\'t here'
            , assistance: 'The person is unable to reply by themselves'
            , deceased: 'The person has died'
            , other: 'Other',
          }
          , thirdPartyReasonCY = {
            nothere: 'Nid yw\'r unigolyn yma'
            , assistance: 'Nid yw\'r unigolyn yn gallu ymateb dros ei hun'
            , deceased: 'Mae\'r unigolyn wedi marw'
            , other: 'Arall',
          }
          , assistanceEN = {
            L: 'Limited mobility'
            , H: 'Hearing impairment'
            , I: 'Diabetes'
            , V: 'Severe sight impairment'
            , R: 'Learning disability',
          }
          , assistanceCY = {
            L: 'Symudedd cyfyngedig'
            , H: 'Nam ar y clyw'
            , I: 'Clefyd siwgr'
            , V: 'Nam difrifol ar eich golwg'
            , R: 'Anabledd dysgu',
          };

        printer = new pdfMake(fonts);

        // Map response data to PDF data

        jurorData = {};

        jurorData.addressRender = getAddressDetails(responseData).currentAddress;

        if (typeof (responseData.specialNeeds) != 'undefined' && responseData.specialNeeds.length > 0){
          jurorData.assistanceNeeded = 'Yes';
          jurorData.assistanceTypeOutput = responseData.specialNeeds
            .filter(function(val) {
              if (val.code !== 'O'){
                return true;
              }
            })
            .map(function(val){
              switch (val.code) {
              case 'L': case 'H': case 'I': case 'V': case 'R':
                return (responseData.welsh === true ? assistanceCY[val.code] : assistanceEN[val.code]);
                break;
              default:
                return val.description;
              }
            })
            .join(',  ');

          jurorData.assistanceTypeDetails = responseData.specialNeeds
            .filter(function(val) {
              if (val.code === 'O'){
                return true;
              }
            })
            .map(function(val){
              return val.detail;
            });

        } else {
          jurorData.assistanceNeeded = 'No';
        }

        jurorData.assistanceSpecialArrangements = responseData.specialNeedsArrangements;


        if (typeof (responseData.cjsEmployments) != 'undefined' && responseData.cjsEmployments.length > 0){
          jurorData.cjsEmployed = true;
        } else {
          jurorData.cjsEmployed = false;
        }
        jurorData.cjsPoliceDetails = getCJSEmploymentDetails(responseData.cjsEmployments, 'Police Force');
        jurorData.cjsPrisonDetails = getCJSEmploymentDetails(responseData.cjsEmployments, 'HM Prison Service');
        jurorData.cjsNca = getCJSEmploymentDetails(responseData.cjsEmployments, 'National Crime Agency');
        jurorData.cjsEmployerDetails = getCJSEmploymentDetails(responseData.cjsEmployments, 'Other');

        jurorData.courtAddress = [responseData.courtLocName, responseData.courtAddress1, responseData.courtAddress2, responseData.courtAddress3, responseData.courtAddress4, responseData.courtAddress5, responseData.courtAddress6, responseData.courtPostcode]
          .filter(function(val) {
            return val;
          }).join('<br>');

        jurorData.dateOfBirth = getDateReversedFormat(getAdditionalChangedDetails(responseData).dateOfBirth.current);
        jurorData.emailAddress = responseData.newEmail;

        if (responseData.deferralReason !== null){

          if (responseData.deferralDate) {
            responseData.deferralDate.split(',')
              .forEach(function(dateStr, index) {
                deferralDate = moment(dateStr, 'DD/MM/YYYY');
                displayDates['date' + (index + 1)] = deferralDate.format('DD/MM/YYYY');
              });
          }

          jurorData.deferral = {reason: responseData.deferralReason, dates: responseData.deferralDate, displayDates: displayDates};
        } else {
          jurorData.deferral = null;
        }

        if (responseData.excusalReason !== null){
          jurorData.excusal = {reason: responseData.excusalReason};
        } else {
          jurorData.excusal = null;
        }

        if (jurorData.deferral === null && jurorData.excusal === null){
          jurorData.confirmedDate = 'Yes';
        } else {
          jurorData.confirmedDate = 'No';
        }

        if (responseData.hearingDate === null){
          courtDate = responseData.poolDate;
        } else {
          courtDate = responseData.hearingDate;
        }
        jurorData.hearingDateShort = moment(courtDate, 'DD/MM/YYYY');
        jurorData.hearingTime = responseData.hearingTime;

        jurorEligible = getEligibilityDetails(responseData).eligible;
        if (jurorEligible === false){
          jurorData.ineligible = 'Yes';
        } else {
          jurorData.ineligible = 'No';
        }
        jurorData.jurorNumber = responseData.jurorNumber;

        jurorData.nameRender = getNameDetails(responseData).currentName;

        jurorData.primaryPhone = responseData.newPhoneNumber;
        jurorData.secondaryPhone = responseData.newAltPhoneNumber;

        jurorData.qualify={
          livedConsecutive:{details: responseData.residencyDetail},
          mentalHealthSectioned:{details: getMentalHealthDetails(responseData).q1Details},
          mentalHealthCapacity:{details: getMentalHealthDetails(responseData).q2Details},
          onBail:{details: responseData.bailDetails},
          convicted:{details: responseData.convictionsDetails},
        };

        jurorData.thirdPartyDetails = {
          nameRender: [responseData.thirdPartyFirstName, responseData.thirdPartyLastName]
            .filter(function(val) {
              return val;
            }).join(' '),
          relationship: responseData.thirdPartyRelationship,
          mainPhone: responseData.thirdPartyMainPhoneNumber,
          otherPhone: responseData.thirdPartyAlternatePhoneNumber,
          emailAddress: responseData.thirdPartyEmailAddress,
          reasonText: '',
        };

        switch (responseData.thirdPartyReason) {
        // eslint-disable-next-line no-undefined
        case undefined:
          break;
        case 'other':
          jurorData.thirdPartyDetails.reasonText = responseData.thirdPartyOtherReason;
          break;
        default:
          if (responseData.thirdPartyReason === 'deceased'){
            jurorDeceased = true;
          }
          if (responseData.welsh === true){
            jurorData.thirdPartyDetails.reasonText = thirdPartyReasonCY[responseData.thirdPartyReason];
          } else {
            jurorData.thirdPartyDetails.reasonText = thirdPartyReasonEN[responseData.thirdPartyReason];
          }
        }

        if (typeof(jurorData.thirdPartyDetails.reasonText) !== 'undefined' && jurorData.thirdPartyDetails.reasonText !== null){
          jurorThirdParty = true;
          jurorData.thirdParty = 'Yes';
        } else {
          jurorData.thirdParty = 'No';
        }

        // Do not show Juror contact details if using Third Party contact details
        if (responseData.useJurorPhoneDetails === false){
          jurorData.primaryPhone = null;
          jurorData.secondaryPhone = null;
        }
        if (responseData.useJurorEmailDetails === false){
          jurorData.emailAddress = null;
        }

        jurorIneligibleAge = getAdditionalChangedDetails(responseData).ageIneligible;

        if (jurorDeceased) {
          docDef = pdfExport.getPdfDocumentDescriptionDeceased(jurorData, (responseData.welsh === true ? welshLanguageText : englishLanguageText));
        } else if (jurorIneligibleAge) {
          docDef = pdfExport.getPdfDocumentDescriptionIneligibleAge(jurorData, (responseData.welsh === true ? welshLanguageText : englishLanguageText));
        } else if (jurorThirdParty) {
          docDef = pdfExport.getPdfDocumentDescriptionThirdParty(jurorData, (responseData.welsh === true ? welshLanguageText : englishLanguageText));
        } else {
          docDef = pdfExport.getPdfDocumentDescription(jurorData, (responseData.welsh === true ? welshLanguageText : englishLanguageText));
        }

        pdfDoc = printer.createPdfKitDocument(docDef);

        pdfDoc.on('data', function(data) {
          chunks.push(data);
        });

        pdfDoc.on('end', function() {
          result = Buffer.concat(chunks);
          res.contentType('application/pdf');
          res.send(result);
        });
        pdfDoc.end();

      };

      //Get response data from back end API
      responseDetailObj.get(require('request-promise'), app, req.session.authToken, req.params.id)
        .then(successData);

    };
  };

  module.exports.getResponded = function(app) {
    return function(req, res) {
      var tmpErrors = _.cloneDeep(req.session.errors)
        , routeParameters = {
          id: req.params['id'],
        }
        , postUrl = app.namedRoutes.build('response.detail.responded.get', routeParameters)
        , cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters)
        , backUrl;

      delete req.session.formFields;
      delete req.session.errors;

      if (req.session.replyDetails.jurorNumber === req.params.id){

        if (typeof req.session.hasModAccess !== 'undefined' && req.session.hasModAccess) {
          if (req.params['type'] === 'paper') {
            routeParameters.type = 'paper';
          } else {
            routeParameters.type = 'digital';
          }

          postUrl = app.namedRoutes.build('response.detail.responded.get', routeParameters);
          backUrl = app.namedRoutes.build('process-reply.get', routeParameters);

          if (req.params['type'] === 'paper') {
            cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
          }
        }

        return res.render('response/process/responded.njk', {
          replyDetails: req.session.replyDetails,
          jurorNumber: req.params.id,
          postUrl: postUrl,
          cancelUrl: cancelUrl,
          backUrl: backUrl,
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      }

      if (req.session.hasModAccess && req.params['type'] === 'paper') {
        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params.id,
          type: 'paper',
        }));
      }
      return res.redirect(app.namedRoutes.build('response.detail.get', {
        id: req.params.id,
      }));
    };
  };

  module.exports.postResponded = function(app) {
    return function(req, res) {
      var validatorResult

        , successCB = function(response) {
          app.logger.info('Updated status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              status: 'CLOSED',
              version: req.body.version,
            },
            response: response,
          });

          // when the user have access to the modernised app we redirect them to their inbox
          // and also show a success message of what they just did
          if (typeof req.session.hasModAccess !== 'undefined' && req.session.hasModAccess) {
            req.session.responseWasActioned = {
              jurorDetails: req.session.replyDetails,
              type: 'Responded',
            };

            return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));
          }

          return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));
        }

        , errorCB = function(err) {
          app.logger.crit('Could not update status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              status: 'CLOSED',
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === '409' || err.statusCode === 409) {
            // eslint-disable-next-line
            err.error.message = 'The summons reply has been updated by another user';
          } else {
            err.error.message = 'Could not update summons reply';
          }

          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': err.error.message}],
          };

          // redirect to the process page?
          if (typeof req.session.hasModAccess !== 'undefined' && req.session.hasModAccess) {
            if (req.params.type === 'paper'){
              return res.redirect(app.namedRoutes.build('process-reply.get', { id: req.params.id, type: 'paper' }));
            }
            return res.redirect(app.namedRoutes.build('process-reply.get', { id: req.params.id }));
          }

          return res.redirect(app.namedRoutes.build('response.detail.responded.get', {
            id: req.params.id,
          }));
        };

      delete req.session.errors;
      delete req.session.formFields;

      // Validate input
      validatorResult = validate(req.body, require('../../../config/validation/responded.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        //return res.status(400).json(validatorResult);
        if (req.params.type === 'paper'){
          return res.redirect(app.namedRoutes.build('response.detail.responded.get', {id: req.params.id, type:'paper'}));
        }
        return res.redirect(app.namedRoutes.build('response.detail.responded.get', {id: req.params.id}));
      }

      if (req.params['type'] === 'paper') {
        return paperUpdateStatus.put(
          app,
          req.session.authToken,
          req.params.id,
          'CLOSED'
        ).then(function() {
          // when the user have access to the modernised app we redirect them to their inbox
          // and also show a success message of what they just did
          if (typeof req.session.hasModAccess !== 'undefined' && req.session.hasModAccess) {
            req.session.responseWasActioned = {
              jurorDetails: req.session.replyDetails,
              type: 'Responded',
            };

            return res.redirect(app.namedRoutes.build('response.paper.details.get', {id: req.params.id, type:'paper'}));
          }
        }).catch(errorCB);
      }

      const payload = {
        jurorNumber: req.body.jurorNumber,
        status: 'CLOSED',
        version: req.body.version,
      };

      updateStatusDAO.post(req, req.body.jurorNumber, payload)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getAwaitingInformation = function() {
    return function(req, res) {
      var tmpErrors
        , tmpFields;

      tmpErrors = _.cloneDeep(req.session.errors);
      tmpFields = _.cloneDeep(req.session.formFields);
      delete req.session.formFields;
      delete req.session.errors;

      if (req.session.replyDetails.jurorNumber === req.params.id){
        return res.render('response/process/awaiting-information.njk', {
          awaitingInformationDetails: tmpFields,
          awaitingInformationUpdate: req.session.awaitingInformation,
          replyDetails: req.session.replyDetails,
          jurorNumber: req.params.id,
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          method: req.params['type'] || 'digital',
        });
      }
      return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));


    };
  };

  module.exports.postAwaitingInformation = function(app) {
    return function(req, res) {

      var validatorResult
        , routeParameters = {
          id: req.params['id'],
        }

        , successCB = function(response) {
          app.logger.info('Updated status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              status: req.body.status,
              version: req.body.version,
            },
            response: response,
          });

          return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));
        }
        , errorCB = function(err) {

          app.logger.crit('Could not update status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              status: req.body.status,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === '500' || err.statusCode === 500) {
            // eslint-disable-next-line
            err.error.message = 'The summons reply has been updated by another user';
          } else {
            err.error.message = 'Could not update summons reply';
          }

          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': err.error.message}],
          };

          return res.redirect(app.namedRoutes.build('response.detail.awaiting.information.get', routeParameters));
        };

      if (req.session.hasModAccess && req.params['type'] === 'paper') {
        routeParameters.type = 'paper';
      }

      // Validate input
      validatorResult = validate(req.body, require('../../../config/validation/awaiting-information.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('response.detail.awaiting.information.get', routeParameters));
      }

      // if a response is paper we process is through the paper response endpoint
      if (req.session.hasModAccess && req.params['type'] === 'paper') {
        return paperUpdateStatus.put(
          app,
          req.session.authToken,
          req.params.id,
          req.body.awaitingInformation
        ).then(function() {
          // TODO: Add error handling and refactor this
          res.redirect(app.namedRoutes.build('response.paper.details.get', {
            id: req.params.id,
            type: 'paper',
          }));
        });
      }

      const payload = {
        jurorNumber: req.body.jurorNumber,
        status: req.body.awaitingInformation,
        version: req.body.version,
      };

      updateStatusDAO.post(req, req.body.jurorNumber, payload)
        .then(successCB)
        .catch(errorCB);

    };
  };

  module.exports.getChangeLog = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          if (parseInt(response.version, 10) === parseInt(req.query.version, 10)) {
            return res.render('response/_modals/change-log.njk', { response: response });
          }

          return res.render('response/_modals/change-log-mismatch.njk', { response: response });
        }
        , errorCB = function() {
          return res.render('response/_modals/change-log.njk', { response: response });
        };


      // Get most recent version of response to check the version number for any changes
      // since beginning the edit process
      responseDetailObj.get(require('request-promise'), app, req.session.authToken, req.params.id)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.validateEdit = function() {
    return function(req, res) {
      var isThirdParty = (req.body.isThirdParty === '1')
        , validatorResult
        , dobValue
        , validatorRules = require('../../../config/validation/edit-' + req.body.target + '.js')(req);


      // Conditionally validate against third party
      if (isThirdParty) {
        validatorRules = _.merge(
          validatorRules,
          require('../../../config/validation/edit-' + req.body.target + '-third-party.js')(req)
        );
      }

      // Add dob fields into single dob object if they exist
      try {
        dobValue = [req.body['dobYear'], req.body['dobMonth'], req.body['dobDay']].filter(function(val) {
          return val;
        }).join('-');

        req.body['dateOfBirth'] = moment(dobValue, 'YYYY-MM-DD');
      } catch (err) {
        delete req.body['dateOfBirth'];
      }

      // Remove that with which we do not need, needs to be done before validation
      if (typeof req.body.postcode !== 'undefined') {
        req.body.postcode = req.body.postcode.replace(/\s*$/, '');
      }

      // Validate input
      validatorResult = validate(req.body, validatorRules);
      if (typeof validatorResult !== 'undefined') {
        return res.status(400).json(validatorResult);
      }

      return res.status(204).send();
    };
  };

  module.exports.edit = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Edited response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            target: req.body.target,
            data: req.body,
            response: response,
          });

          return res.status(204).send();
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to edit response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            target: req.body.target,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send(err.error);
        };

      // Handle each edit type
      switch (req.body.target) {
      case 'juror-details':
        return responseDetailObj.editJurorDetails(require('request-promise'), app, req.session.authToken, req.params.id, req.body)
          .then(successCB)
          .catch(errorCB);
        break;
      case 'eligibility':
        return responseDetailObj.editEligibility(require('request-promise'), app, req.session.authToken, req.params.id, req.body)
          .then(successCB)
          .catch(errorCB);
        break;
      case 'deferral-excusal':
        return responseDetailObj.editDeferralExcusal(require('request-promise'), app, req.session.authToken, req.params.id, req.body)
          .then(successCB)
          .catch(errorCB);
        break;
      case 'cjs-employment':
        return responseDetailObj.editCjsEmployment(require('request-promise'), app, req.session.authToken, req.params.id, req.body)
          .then(successCB)
          .catch(errorCB);
      case 'reasonable-adjustments':
        return responseDetailObj.editReasonableAdjustments(require('request-promise'), app, req.session.authToken, req.params.id, req.body)
          .then(successCB)
          .catch(errorCB);
      default:
        return res.status(501).json({ message: 'Not implemented' });
        break;
      };
    };
  };

  module.exports.getSendToCourt = function() {
    return function(req, res) {
      return res.render('response/_modals/send-to-court.njk');
    };
  };

  module.exports.postSendToCourt = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('response send to court request: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              version: req.body.version,
            },
            response: response,
          });

          return res.status(204).send();
        }
        , errorCB = function(err) {
          app.logger.crit('Could not process response send to court request: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send(err.error);
        };

      // Send to API
      sendCourtObj.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.id,
        req.body.version
      )
        .then(successCB)
        .catch(errorCB);
    };
  };


  // Display modals for records with a POOL status that differs from RESPONSE status
  // Called from status.js

  module.exports.getBureauStatus = function() {
    return function(req, res) {
      return res.render('response/_modals/select-status.njk');
    };
  };

  module.exports.postBureauStatus = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Updated status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              status: req.body.status,
              version: req.body.version,
            },
            response: response,
          });

          return res.status(204).send();
        }
        , errorCB = function(err) {
          app.logger.crit('Could not update status of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              status: req.body.status,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === '409' || err.statusCode === 409) {
            // eslint-disable-next-line
            err.error.message = 'The Juror Digital response that you are trying to update has been updated by someone else since you started this process. Please check the updated values and reapply your changes if necessary.';
          } else if (err.statusCode === '400') {
            err.error.message = 'The Juror Digital response that you are trying to update has already been updated.';
          }

          return res.status(err.statusCode).send(err.error);
        };

      const payload = {
        jurorNumber: req.params.id,
        status: req.body.status,
        version: req.body.version,
      };

      updateStatusDAO.post(req, payload, req.body.jurorNumber)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getCompleted = function() {
    return function(req, res) {
      return res.render('response/_modals/completed.njk');
    };
  };



  // Utility functions

  function getNameDetails(data) {
    var newNameRender = [data.newTitle, data.newFirstName, data.newLastName].filter(function(val) {
        return val;
      }).join(' ')

      , nameRender = [data.title, data.firstName, data.lastName].filter(function(val) {
        return val;
      }).join(' ')

      , hasNewName = (
        data.newTitle !== data.title ||
        data.newFirstName !== data.firstName ||
        data.newLastName !== data.lastName
      );

    return {
      changed: (hasNewName === true),
      currentName: (hasNewName) ? newNameRender : nameRender,
      oldName: (hasNewName) ? nameRender : null,
      //headerNameRender: (hasNewName) ? newNameRender.replace(data.newTitle+' ', '') : nameRender.replace(data.title+' ', ''),
      headerNameRender: (hasNewName) ? newNameRender : nameRender,
      title: (hasNewName) ? data.newTitle : data.title,
      firstName: (hasNewName) ? data.newFirstName : data.firstName,
      lastName: (hasNewName) ? data.newLastName : data.lastName,
    };
  }

  function getAddressDetails(data) {
    var newAddressRender = [
        data.newJurorAddress1,
        data.newJurorAddress2,
        data.newJurorAddress3,
        data.newJurorAddress4,
        data.newJurorAddress5,
        data.newJurorAddress6,
        data.newJurorPostcode,
      ].filter(function(val) {
        return typeof val !== 'undefined' && val !== null && val.length > 0;
      }).join('<br>')

      , addressRender = [
        data.jurorAddress1,
        data.jurorAddress2,
        data.jurorAddress3,
        data.jurorAddress4,
        data.jurorAddress5,
        data.jurorAddress6,
        data.jurorPostcode,
      ].filter(function(val) {
        return typeof val !== 'undefined' && val !== null && val.length > 0;
      }).join('<br>')

      , hasNewAddress = newAddressRender !== addressRender;

    return {
      changed: (hasNewAddress === true),
      currentAddress: (hasNewAddress) ? newAddressRender : addressRender,
      oldAddress: (hasNewAddress) ? addressRender : null,

      address1: (hasNewAddress) ? data.newJurorAddress1 : data.jurorAddress1,
      address2: (hasNewAddress) ? data.newJurorAddress2 : data.jurorAddress2,
      address3: (hasNewAddress) ? data.newJurorAddress3 : data.jurorAddress3,
      address4: (hasNewAddress) ? data.newJurorAddress4 : data.jurorAddress4,
      address5: (hasNewAddress) ? data.newJurorAddress5 : data.jurorAddress5,
      address6: (hasNewAddress) ? data.newJurorAddress6 : data.jurorAddress6,
      postcode: (hasNewAddress) ? data.newJurorPostcode : data.jurorPostcode,
    };
  }

  function getAdditionalChangedDetails(data) {
    var dobChanged = (data.dateOfBirth !== data.newDateOfBirth && typeof data.dateOfBirth !== 'undefined' && data.dateOfBirth !== null && data.dateOfBirth.length !== 0)
      , emailChanged = (data.email !== data.newEmail && typeof data.email !== 'undefined' && data.email !== null && data.email.trim().length !== 0)
      , ageCalcDob = data.newDateOfBirth
      , calculatedAge = data.hearingDate !== null ? moment(data.hearingDate, 'DD/MM/YYYY').diff(moment(ageCalcDob, 'DD/MM/YYYY'), 'years') : moment().diff(moment(ageCalcDob, 'DD/MM/YYYY'), 'years')
      , currentDob = data.newDateOfBirth
      , dateOfBirthParts
      , phoneChanged
      , altPhoneChanged;

    if (data.useJurorEmailDetails === 'N') {
      emailChanged = (data.email !== data.thirdPartyEmail && typeof data.email !== 'undefined' && data.email !== null &&
      data.email.trim().length !== 0);
    }

    if (data.useJurorPhoneDetails || data.useJurorPhoneDetails === 'undefined' || data.useJurorPhoneDetails === null) {
      phoneChanged = (data.phoneNumber !== data.newPhoneNumber && typeof data.phoneNumber !== 'undefined' && data.phoneNumber !== null && data.phoneNumber.length !== 0);
      altPhoneChanged = (data.altPhoneNumber !== data.newAltPhoneNumber && typeof data.altPhoneNumber !== 'undefined' && data.altPhoneNumber !== null && data.altPhoneNumber.length !== 0 && (data.altPhoneNumber !== data.newPhoneNumber));
    } else {
      phoneChanged = (data.phoneNumber !== data.thirdPartyMainPhoneNumber && typeof data.phoneNumber !== 'undefined' && data.phoneNumber !== null && data.phoneNumber.length !== 0);
      altPhoneChanged = (data.altPhoneNumber !== data.thirdPartyAlternatePhoneNumber && typeof data.altPhoneNumber !== 'undefined' && data.altPhoneNumber !== null && data.altPhoneNumber.length !== 0 && (data.thirdPartyAlternatePhoneNumber !== data.thirdPartyMainPhoneNumber));
    }

    try {
      dateOfBirthParts = moment(currentDob, 'DD/MM/YYYY').format('YYYY-MM-DD').split('-');
    } catch (e) { }

    return {
      dateOfBirth: {
        changed: dobChanged,
        current: currentDob,
        old: (dobChanged) ? data.dateOfBirth : null,
        currentAge: calculatedAge,

        dobDay: (dateOfBirthParts.length === 3) ? dateOfBirthParts[2] : null,
        dobMonth: (dateOfBirthParts.length === 3) ? dateOfBirthParts[1] : null,
        dobYear: (dateOfBirthParts.length === 3) ? dateOfBirthParts[0] : null,
      },

      phone: {
        changed: phoneChanged,
        current: (data.useJurorPhoneDetails) ? data.newPhoneNumber : '',
        old: (phoneChanged) ? data.phoneNumber : null,
      },

      altPhone: {
        changed: altPhoneChanged,
        current: (data.useJurorPhoneDetails) ? data.newAltPhoneNumber : '',
        old: (altPhoneChanged) ? data.altPhoneNumber : null,
      },

      email: {
        changed: emailChanged,
        current: (data.useJurorEmailDetails) ? data.newEmail : '',
        old: (emailChanged) ? data.email : null,
      },

      ageIneligible: calculatedAge < 18 || calculatedAge > 75,
      hasChange: dobChanged || phoneChanged || altPhoneChanged || emailChanged,
    };
  }

  function getEligibilityDetails(data) {
    var residency = (data.thirdPartyReason === 'deceased' || (data.residency === 'Y' || data.residency === '1' || data.residency === true))
      , mentalHealth = (data.thirdPartyReason !== 'deceased' && (data.mentalHealthAct === 'Y' || data.mentalHealthAct === '1' || data.mentalHealthAct === true))
      , bail = (data.thirdPartyReason !== 'deceased' && (data.bail === 'Y' || data.bail === '1' || data.bail === true))
      , convictions = (data.thirdPartyReason !== 'deceased' && (data.convictions === 'Y' || data.convictions === '1' || data.convictions === true));

    return {
      eligible: (residency && !mentalHealth && !bail && !convictions),
      residency: residency,
      mentalHealthAct: mentalHealth,
      bail: bail,
      convictions: convictions,
    };
  }

  function getThirdPartyDetails(data) {
    var thirdPartyName = [data.thirdPartyFirstName, data.thirdPartyLastName].filter(function(val) {
        return val;
      }).join(' ')
      , thirdPartyReason
      , thirdPartyRelationship = data.thirdPartyRelationship
      , thirdPartyMainPhone = data.thirdPartyMainPhoneNumber
      , thirdPartyOtherPhone = data.thirdPartyAlternatePhoneNumber
      , thirdPartyEmail = data.thirdPartyEmailAddress;

    switch (data.thirdPartyReason) {
    case 'nothere':
      thirdPartyReason = 'Juror is not here';
      break;
    case 'deceased':
      thirdPartyReason = 'Deceased';
      break;
    case 'assistance':
      thirdPartyReason = 'Assistance';
      break;
    default:
      thirdPartyReason = data.thirdPartyOtherReason;
      break;
    }

    return {
      isThirdParty: (
        thirdPartyName.length > 0 ||
        (typeof thirdPartyReason !== 'undefined' && thirdPartyReason !== null && thirdPartyReason.length > 0)
      ),
      name: thirdPartyName,
      firstName: data.thirdPartyFirstName,
      lastName: data.thirdPartyLastName,
      relationship: thirdPartyRelationship,
      reason: thirdPartyReason,
      mainPhone: thirdPartyMainPhone,
      otherPhone: thirdPartyOtherPhone,
      email: thirdPartyEmail,
      reasonRaw: data.thirdPartyReason,
      reasonOther: data.thirdPartyOtherReason,
    };
  }

  function getCJSEmploymentDetails(data, employer){
    var returnData = null;

    returnData = data
      .filter(function(val) {
        if (val.employer === employer){
          return true;
        }
      })
      .map(function(val){
        return val.details.toString();
      });

    if (returnData.length > 0){
      returnData = returnData[0];
    } else {
      returnData = null;
    }

    return returnData;
  }

  function getAssistanceDetails(data){
    var returnData = null;

    returnData = data
      .filter(function(val) {
        if (val.employer === employer){
          return true;
        }
      })
      .map(function(val){
        return val.details.toString();
      });

    if (returnData.length > 0){
      returnData = returnData[0];
    } else {
      returnData = null;
    }

    return returnData;
  }

  function getMentalHealthDetails(data){
    var splitData = null
      , mhQ1 = null
      , mhQ2 = null;

    if (data.mentalHealthActDetails !== 'undefined' && data.mentalHealthActDetails !== null){
      splitData = data.mentalHealthActDetails.split('[MENTAL HEALTH Q2]');
      if (splitData.length > 1){
        mhQ1 = splitData[0].trim();
        mhQ2 = splitData[1].trim();
      } else {
        mhQ1 = splitData[0].trim();
        mhQ2 = splitData[0].trim();
      }
    } else {
      mhQ1 = null;
      mhQ2 = null;
    }

    return {q1Details: mhQ1, q2Details: mhQ2};

  }

  function getDateReversedFormat(dateString){

    // Converts date string formatted DD/MM/YYYY to YYYY/MM/DD format

    var dateParts
      , returnValue = null;

    if (typeof (dateString) != 'undefined' && dateString != null){
      try {
        dateParts = dateString.split('/');
        returnValue = [dateParts[2], dateParts[1], dateParts[0]].join('/');
      } catch (e) { }
    }

    return returnValue;
  }

  function getCatchmentStatus(app, req){
    var catchmentStatus = ''
      , successCB = function(data) {

        catchmentStatus = data.status;
        return catchmentStatus;
      }
      , errorCB = function(err) {
        app.logger.crit('Could not fetch catchment status: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber: req.params.id,
            body: req.body,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        catchmentStatus = 'NotFound';
        return catchmentStatus;
      };

    courtObj.getCatchmentStatus(require('request-promise'), app, req.session.authToken, req.params.id)
      .then(successCB)
      .catch(errorCB);
  }

  function executeAllPromises(promises) {
    // Wrap all Promises in a Promise that will always "resolve"
    var  errors = []
      , results = []
      , resolvingPromises = promises.map(function(promise) {
        return new Promise(function(resolve) {
          var payload = new Array(2);

          promise.then(function(result) {
            payload[0] = result;
          })
            .catch(function(error) {
              payload[1] = error;
            })
            .then(function() {

              resolve(payload);
            });
        });
      });

    // Execute all wrapped Promises
    return Promise.all(resolvingPromises)
      .then(function(items) {
        items.forEach(function(payload) {
          if (payload[1]) {
            if (payload[1].name === 'StatusCodeError'){
              results.push({status: 'NotFound'});
            } else {
              errors.push(payload[1]);
            }
          } else {
            results.push(payload[0]);
          }
        });

        return {
          errors: errors,
          results: results,
        };
      });
  }

  function getProcessingStatusDisplay(statusVal, hasModAccess = false){

    var statusDesc = null;

    if (typeof statusVal === 'string'){
      switch (statusVal) {
      case 'TODO':
        statusDesc = 'To do';
        break;
      case 'AWAITING_CONTACT':
        statusDesc = hasModAccess ? 'Awaiting juror info' : 'Awaiting juror reply';
        break;
      case 'AWAITING_COURT_REPLY':
        statusDesc = 'Awaiting court reply';
        break;
      case 'AWAITING_TRANSLATION':
        statusDesc = 'Awaiting translation';
        break;
      case 'CLOSED':
        statusDesc = 'Completed';
        break;
      default:
        statusDesc = null;
      }
    }

    return statusDesc;
  }

  function getReplyType(responseData, hasModAccess){
    var replyType = ''
      , isAutoProcessed = false
      , isExcusal = false
      , isDeferral = false
      , isIneligible = false
      , isDeceased = false
      , needsReview = false
      , valYes = 'Y'
      , valNo = 'N';

    if (responseData.thirdPartyReason){
      if (responseData.processingStatus === 'CLOSED' && responseData.thirdPartyReason.toUpperCase() === 'DECEASED'){
        isDeceased = true;
      }
    }

    if (responseData.assignedStaffMember) {
      if (responseData.processingStatus === 'CLOSED' && responseData.assignedStaffMember.name === 'AUTO'){
        isAutoProcessed = true;
      }
    }

    if (responseData.excusalReason){
      isExcusal = true;
      responseData.excusal = true;

      if (hasModAccess && responseData.excusalReason === 'D') {
        isDeceased = true;
      }
    }

    if (responseData.deferralDate){
      isDeferral = true;
    }

    if (responseData.bail ||
      !responseData.residency ||
      responseData.convictions ||
      responseData.mentalHealthAct) {
      isIneligible = true;
    }

    if (responseData.processingStatus === 'TODO' || responseData.processingStatus === 'CLOSED'){
      // Default for ToDo / Closed items
      needsReview = true;
    }

    if (responseData.processingStatus === 'TODO' || responseData.processingStatus === 'CLOSED'){
      // Set reply type for ToDo / Closed items
      if (isDeceased){
        replyType = 'DECEASED';
      } else if (isAutoProcessed){
        replyType = 'AUTO PROCESSED';
      } else if (isIneligible){
        replyType = 'INELIGIBLE';
      } else if (isExcusal){
        replyType = 'EXCUSAL';
      } else if (isDeferral){
        replyType = 'DEFERRAL';
      } else if (needsReview){
        replyType = 'NEEDS REVIEW';
      } else {
        replyType = '';
      }
    } else {
      // Set reply type for Awaiting information items
      replyType = 'NEEDS REVIEW';
    }

    return replyType;

  }

  function getDeferralDatesArray(strDates){

    // Parse string of comma separated dates into array
    var arrDates = []
      , returnDates = []
      , index=0
      , dateVal;

    if (strDates){
      arrDates = strDates.split(',').map(item => item.trim());
      for (index=0; index<arrDates.length; index++){
        dateVal = arrDates[index];
        returnDates.push({
          dateValue: dateVal,
          displayValue: moment(dateVal, 'DD/MM/YYYY').format('D MMMM YYYY'),
        });
      }
    }

    return returnDates;

  }

})();
