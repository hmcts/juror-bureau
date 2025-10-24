;(function(){
  'use strict';

  const moment = require('moment');
  const validate = require('validate.js');
  const _ = require('lodash');
  const pdfMake = require('pdfmake');
  const modUtils = require('../../../lib/mod-utils');
  const responseDetailObj = require('../../../objects/response-detail.js').object;
  const pdfExport = require('../../../lib/pdfExport');
  const englishLanguageText = require('../../../../client/js/i18n/en/PDF.json');
  const welshLanguageText = require('../../../../client/js/i18n/cy/PDF.json');
  const paperUpdateStatus = require('../../../objects/summons-management').updateStatus;
  const opticReferenceObj = require('../../../objects/juror-record').opticReferenceObject;
  const { systemCodesDAO } = require('../../../objects/administration');
  const { dateFilter } = require('../../../components/filters');
  const jurorRecordObject = require('../../../objects/juror-record');
  const { courtLocationsFromPostcodeObj } = require('../../../objects/court-location.js');
  const { resolveCatchmentResponse } = require('../../summons-management/summons-management.controller.js');
  const { updateStatusDAO } = require('../../../objects');

  module.exports.index = function(app) {
    return function(req, res) {
      let promiseArr = [];

      delete req.session[`catchmentWarning-${req.params.id}`];
      delete req.session.requestInfo;
      req.session.replyDetails = {};
      req.session.editableReplyDetails = {};

      promiseArr.push(
        responseDetailObj.get(
          req,
          req.params.id,
          req.session.hasModAccess
        )
      );
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
        .then((response) => {
          const data = response.results[0];
          const nameDetails = getNameDetails(data);
          const addressDetails = getAddressDetails(data);
          const additionalChangeDetails = getAdditionalChangedDetails(data);
          const eligibilityDetails = getEligibilityDetails(data);
          const thirdPartyDetails = getThirdPartyDetails(data);
          const canEdit = (
              data.processingStatus !== 'CLOSED' && data.superUrgent !== true
            );
          let poolStatus;
          let processingStatus;
          let renderPage;
          let responseCompletedMesssage;

          // Calculate which sub-nav items are highlighted for importance
          const importantNavItems = {
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
            data: {
              responseId: req.params.id,
            },
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
              assistanceType: modUtils.reasonsArrToObj(response.results[1])[data.specialNeeds[0].code],
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

          data.phoneLogs = response.results[2].data.contactLogs;

          return opticReferenceObj.get(
            req,
            data.jurorNumber,
            data.poolNumber,
          )
            .then((opticReference) => {
              app.logger.info('Fetched the optic reference for the juror if available: ', {
                auth: req.session.authentication,
                data: {
                  jurorNumber: req.params['id'],
                  opticReference: opticReference,
                },
              });

              if (data.newJurorPostcode !== data.jurorPostcode && data.processingStatus !== 'Closed') {
                const postcode = modUtils.splitPostCode(data.newJurorPostcode);

                return courtLocationsFromPostcodeObj.get(
                  req,
                  postcode
                )
                  .then((catchmentResponse) => {
                    app.logger.info('Fetched the courts for new address: ', {
                      auth: req.session.authentication,
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
                  })
                  .catch((err) => {
                    // NO CATCHEMENT AREA FOR POSTCODE
                    if (err.statusCode === 404) {
                      app.logger.crit('No catchment area for juror\'s postcode: ', {
                        auth: req.session.authentication,
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
                      data: req.params['id'],
                      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
                    });

                    return res.redirect(app.namedRoutes.build('homepage.get'));
                  });

              }

              if (data.processingStatus === 'CLOSED') {
                data.processedBannerMessage = modUtils.resolveProcessedBannerMessage(data.statusRender, {
                  isExcusal: !!data.excusalReason,
                  isDeceased: data.thirdPartyReason === 'deceased' || data.excusalReason === 'D',
                });
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
        })
        .catch((err) => {
          app.logger.crit('Failed to fetch and parse single response: ', {
            auth: req.session.authentication,
            data: {
              responseId: req.params.id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('index.njk');
        });
    };
  };

  module.exports.getDownloadPDF = function(app) {
    return async function(req, res) {
      try {
        const responseData = await responseDetailObj.get(req, req.params.id);

        let pdfDoc;
        const fonts = {
          OpenSans: {
            normal: './client/assets/fonts/OpenSans-Regular.ttf',
            bold: './client/assets/fonts/OpenSans-Bold.ttf',
          },
        };
        let printer;
        let jurorData = {};
        let chunks = [];
        let result;
        let docDef;
        let courtDate;
        let jurorEligible = false;
        let jurorIneligibleAge = false;
        let jurorDeceased = false;
        let jurorThirdParty = false
        let deferralDate;;
        let displayDates = {};
        const thirdPartyReasonEN = {
          nothere: 'The person isn\'t here',
          assistance: 'The person is unable to reply by themselves',
          deceased: 'The person has died',
          other: 'Other',
        };
        const thirdPartyReasonCY = {
          nothere: 'Nid yw\'r unigolyn yma',
          assistance: 'Nid yw\'r unigolyn yn gallu ymateb dros ei hun',
          deceased: 'Mae\'r unigolyn wedi marw',
          other: 'Arall',
        };
        const assistanceEN = {
          L: 'Limited mobility',
          H: 'Hearing impairment',
          I: 'Diabetes',
          V: 'Severe sight impairment',
          R: 'Learning disability',
        };
        const assistanceCY = {
          L: 'Symudedd cyfyngedig',
          H: 'Nam ar y clyw',
          I: 'Clefyd siwgr',
          V: 'Nam difrifol ar eich golwg',
          R: 'Anabledd dysgu',
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

        jurorData.dateOfBirth = dateFilter(getAdditionalChangedDetails(responseData).dateOfBirth.current, 'DD/MM/YYYY', 'YYYY/MM/DD');
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
      } catch (err) {
        app.logger.crit('Could not generate PDF document: ', {
          auth: req.session.authentication,
          data: {
            jurorNumber: req.params.id,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
      }
    };
  };

  module.exports.getResponded = function(app) {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const routeParameters = {
        id: req.params['id'],
      };
      let postUrl = app.namedRoutes.build('response.detail.responded.get', routeParameters);
      let cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
      let backUrl;

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

      if (req.params['type'] === 'paper') {
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
    return async function(req, res) {
      let validatorResult;

      const errorCB = (err) => {
        app.logger.crit('Could not update status of response: ', {
          auth: req.session.authentication,
          data: {
            jurorNumber: req.params.id,
            status: 'CLOSED',
            version: req.body.version,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === '409' || err.statusCode === 409) {
          err.error.message = 'The summons reply has been updated by another user';
        } else {
          err.error.message = 'Could not update summons reply';
        }

        req.session.formFields = req.body;
        req.session.errors = {
          '': [{'details': err.error.message}],
        };

        if (req.params.type === 'paper'){
          return res.redirect(app.namedRoutes.build('process-reply.get', { id: req.params.id, type: 'paper' }));
        }
        return res.redirect(app.namedRoutes.build('process-reply.get', { id: req.params.id }));
      };

      delete req.session.errors;
      delete req.session.formFields;

      validatorResult = validate(req.body, require('../../../config/validation/responded.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        if (req.params.type === 'paper'){
          return res.redirect(app.namedRoutes.build('response.detail.responded.get', {id: req.params.id, type:'paper'}));
        }
        return res.redirect(app.namedRoutes.build('response.detail.responded.get', { id: req.params.id, type: 'digital' }));
      }

      if (req.params['type'] === 'paper') {
        try {
          await paperUpdateStatus.put(
            req,
            req.params.id,
            'CLOSED'
          );

          req.session.responseWasActioned = {
            jurorDetails: req.session.replyDetails,
            type: 'Responded',
          };

          return res.redirect(app.namedRoutes.build('response.paper.details.get', {id: req.params.id, type:'paper'}));
        } catch (err) {
          return errorCB(err);
        }
      }

      const payload = {
        jurorNumber: req.body.jurorNumber,
        status: 'CLOSED',
        version: req.body.version,
      };

      try {
        const response = await updateStatusDAO.post(req, req.body.jurorNumber, payload);

        app.logger.info('Updated status of response: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber: req.params.id,
              status: 'CLOSED',
              version: req.body.version,
            },
          });

          req.session.responseWasActioned = {
            jurorDetails: req.session.replyDetails,
            type: 'Responded',
          };

          return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));
      } catch (err) {
        return errorCB(err);
      }
    };
  };

  module.exports.getAwaitingInformation = function() {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpFields = _.cloneDeep(req.session.formFields);

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
      const routeParameters = {
        id: req.params['id'],
        type: req.params['type'] === 'paper' ? 'paper' : 'digital',
      };

      // Validate input
      const validatorResult = validate(req.body, require('../../../config/validation/awaiting-information.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('response.detail.awaiting.information.get', routeParameters));
      }

      // if a response is paper we process is through the paper response endpoint
      if (req.session.hasModAccess && req.params['type'] === 'paper') {
        return paperUpdateStatus.put(
          req,
          req.params.id,
          req.body.awaitingInformation
        ).then(function() {
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

      try {
        const response =  updateStatusDAO.post(req, req.body.jurorNumber, payload)
        app.logger.info('Updated status of response: ', {
          auth: req.session.authentication,
          data: {
            jurorNumber: req.params.id,
            status: req.body.status,
            version: req.body.version,
          },
        });

        return res.redirect(app.namedRoutes.build('response.detail.get', {id: req.params.id}));
      } catch {err} {
        app.logger.crit('Could not update status of response: ', {
          auth: req.session.authentication,
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
      }

    };
  };

  // Utility functions

  const getNameDetails = (data) => {
    const newNameRender = [data.newTitle, data.newFirstName, data.newLastName].filter(function(val) {
      return val;
    }).join(' ');

    const nameRender = [data.title, data.firstName, data.lastName].filter(function(val) {
      return val;
    }).join(' ')

    const hasNewName = (
      data.newTitle !== data.title ||
      data.newFirstName !== data.firstName ||
      data.newLastName !== data.lastName
    );

    return {
      changed: (hasNewName === true),
      currentName: (hasNewName) ? newNameRender : nameRender,
      oldName: (hasNewName) ? nameRender : null,
      headerNameRender: (hasNewName) ? newNameRender : nameRender,
      title: (hasNewName) ? data.newTitle : data.title,
      firstName: (hasNewName) ? data.newFirstName : data.firstName,
      lastName: (hasNewName) ? data.newLastName : data.lastName,
    };
  }

  const getAddressDetails = (data) => {
    const newAddressRender = [
      data.newJurorAddress1,
      data.newJurorAddress2,
      data.newJurorAddress3,
      data.newJurorAddress4,
      data.newJurorAddress5,
      data.newJurorAddress6,
      data.newJurorPostcode,
    ].filter(function(val) {
      return typeof val !== 'undefined' && val !== null && val.length > 0;
    }).join('<br>');

    const addressRender = [
      data.jurorAddress1,
      data.jurorAddress2,
      data.jurorAddress3,
      data.jurorAddress4,
      data.jurorAddress5,
      data.jurorAddress6,
      data.jurorPostcode,
    ].filter(function(val) {
      return typeof val !== 'undefined' && val !== null && val.length > 0;
    }).join('<br>');

    const hasNewAddress = newAddressRender !== addressRender;

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

  const getAdditionalChangedDetails = (data) => {
    const dobChanged = (data.dateOfBirth !== data.newDateOfBirth && typeof data.dateOfBirth !== 'undefined' && data.dateOfBirth !== null && data.dateOfBirth.length !== 0);
    let emailChanged = (data.email !== data.newEmail && typeof data.email !== 'undefined' && data.email !== null && data.email.trim().length !== 0);
    const ageCalcDob = data.newDateOfBirth;
    const calculatedAge = data.hearingDate !== null ? moment(data.hearingDate, 'DD/MM/YYYY').diff(moment(ageCalcDob, 'DD/MM/YYYY'), 'years') : moment().diff(moment(ageCalcDob, 'DD/MM/YYYY'), 'years');
    const currentDob = data.newDateOfBirth;
    let dateOfBirthParts;
    let phoneChanged;
    let altPhoneChanged;

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

  const getEligibilityDetails = (data) => {
    const residency = (data.thirdPartyReason === 'deceased' || (data.residency === 'Y' || data.residency === '1' || data.residency === true));
    const mentalHealth = (data.thirdPartyReason !== 'deceased' && (data.mentalHealthAct === 'Y' || data.mentalHealthAct === '1' || data.mentalHealthAct === true));
    const bail = (data.thirdPartyReason !== 'deceased' && (data.bail === 'Y' || data.bail === '1' || data.bail === true));
    const convictions = (data.thirdPartyReason !== 'deceased' && (data.convictions === 'Y' || data.convictions === '1' || data.convictions === true));

    return {
      eligible: (residency && !mentalHealth && !bail && !convictions),
      residency,
      residencyDetails: data.residencyDetail,
      mentalHealthAct: mentalHealth,
      mentalHealthActDetails: data.mentalHealthActDetails,
      bail,
      bailDetails: data.bailDetails,
      convictions,
      convictionsDetails: data.convictionsDetails,
    };
  }

  const getThirdPartyDetails = (data) =>{
    const thirdPartyName = [data.thirdPartyFirstName, data.thirdPartyLastName].filter(function(val) {
        return val;
      }).join(' ');
    const thirdPartyRelationship = data.thirdPartyRelationship;
    const thirdPartyMainPhone = data.thirdPartyMainPhoneNumber;
    const thirdPartyOtherPhone = data.thirdPartyAlternatePhoneNumber;
    const thirdPartyEmail = data.thirdPartyEmailAddress;
    let thirdPartyReason;

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

  const getCJSEmploymentDetails = (data, employer) => {
    let returnData = null;

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

  const getMentalHealthDetails = (data) => {
    let splitData = null;
    let mhQ1 = null;
    let mhQ2 = null;

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

  const executeAllPromises = async (promises) => {
    // Wrap all Promises in a Promise that will always "resolve"
    let errors = [];
    let results = [];
    const resolvingPromises = promises.map(function(promise) {
      return new Promise(function(resolve) {
        const payload = new Array(2);

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
    const items_1 = await Promise.all(resolvingPromises);
    items_1.forEach(function (payload_1) {
      if (payload_1[1]) {
        if (payload_1[1].name === 'StatusCodeError') {
          results.push({ status: 'NotFound' });
        } else {
          errors.push(payload_1[1]);
        }
      } else {
        results.push(payload_1[0]);
      }
    });
    return {
      errors: errors,
      results: results,
    };
  }

  const getProcessingStatusDisplay = (statusVal, hasModAccess = false) => {
    let statusDesc = null;

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

  const getReplyType = (responseData, hasModAccess) => {
    let replyType = '';
    let isAutoProcessed = false;
    let isExcusal = false;
    let isDeferral = false;
    let isIneligible = false;
    let isDeceased = false;
    let needsReview = false;

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

})();
