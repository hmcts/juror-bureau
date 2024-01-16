;(function(){
  'use strict';

  var dashboardObj = require('../../objects/dashboard').object
    , smartSurveyExportObj = require('../../objects/smart-survey-export').object
    , smartSurveyResponseObj = require('../../objects/smart-survey-response').object
    , config = require('../../config/environment')()
    , secretsConfig = require('config')
    , jwt = require('jsonwebtoken')
    , moment = require('moment')
    , validate = require('validate.js')
    , surveyExportResponsesReceived = 0
    , surveyExportResponsesRequired = 0
    , surveyExportIdV1 = 0
    , surveyExportIdV2 = 0
    , surveyResponses = []
    , requireV1Survey = false
    , requireV2Survey = false
    , responseSent = false
    , dashboardYears = []

    , surveyTotals = {
      surveyDataError: false,
      responsesTotal:  0,
      verySatisfiedTotal: 0,
      verySatisfiedFormatted: '',
      verySatisfiedPercent: 0,
      satisfiedTotal: 0,
      satisfiedFormatted: '',
      satisfiedPercent: 0,
      neitherTotal: 0,
      neitherFormatted: '',
      neitherPercent: 0,
      dissatisfiedTotal: 0,
      dissatisfiedFormatted: '',
      dissatisfiedPercent: 0,
      veryDissatisfiedTotal: 0,
      veryDissatisfiedFormatted: '',
      veryDissatisfiedPercent: 0,
      satifiedAndVerySatisfiedPercent: 0,
      completedFeedbackPercent: 0
    }

    , dashboardDates = {
      'startMonth': null,
      'startYear': null,
      'endMonth': null,
      'endYear': null,
      'startDate': null,
      'endDate': null,
      'errorFlag': false,
      'errorMessage': ''
    };


  module.exports.index = function(app) {
    return function(req, res) {
      var minYear
        , maxYear
        , yearLoop
        , yearList = []
        , apiError

        , successCB = function(response) {

          req.session.historicTotals = {
            historicTotals: getHistoricTotals(response)
          }

          return res.render('./dashboard/index.njk', {
            dashboardData: req.session.historicTotals,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
            errors: null
          });
        }

        , errorCB = function(response) {

          req.session.historicTotals = null;

          apiError = {
            items: {
              api: {
                summary: 'Error retrieving dashboard data'
              }
            }
          }

          req.session.errors = apiError;

          return res.render('./dashboard/index.njk', {
            dashboardData: null,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
            errors: req.session.errors
          });
        }

        , apiDates = {
          'startDate': '',
          'endDate': '',
        }
        , jwtToken
        , apiUserObj

      // Initialise list of years
      minYear = 2019;
      maxYear = moment().year();
      for (yearLoop=minYear; yearLoop<=maxYear; yearLoop++) {
        yearList.push(yearLoop);
      }

      dashboardYears = yearList;

      // Clear session data
      delete req.session.searchResponse;
      delete req.session.formFields;
      delete req.session.errors;
      delete req.session.nav;
      delete req.session.dashboardDates;
      delete req.session.formFields;

      req.session.historicTotals = null;

      req.session.surveyExportIdOld = 0;
      req.session.surveyExportIdNew = 0;

      /*
      app.logger.info('Smart Survey config settings: ', {
        smartSurveyAPIEndpoint: config.smartSurveyAPIEndpoint,
        smartSurveyIdV1: config.smartSurveyIdV1,
        smartSurveyIdV2: config.smartSurveyIdV2,
        smartSurveyExportV1: config.smartSurveyExportV1,
        smartSurveyExportV2: config.smartSurveyExportV2
      });
      */

      // Create user object for JWT
      apiUserObj = {
        login: 'AUTO',
        userLevel: '1',
        daysToExpire: 6,
        passwordWarning: true,
        staff: {
          name: 'AUTO',
          rank: -1,
          active: 1,
          courts: []
        }
      }

      // Create JWT
      jwtToken = jwt.sign(apiUserObj, secretsConfig.get('secrets.juror-digital-vault.bureau-jwtKey'), { expiresIn: secretsConfig.get('secrets.juror-digital-vault.bureau-jwtTTL') });

      // Create a date range based in current date - a date range is not required for the API to return the historic values
      apiDates = {
        'startDate': moment().format('YYYY-MM-DD') + 'T00:00:00',
        'endDate': moment().format('YYYY-MM-DD') + 'T00:00:00'
      }

      dashboardObj
        .post(require('request-promise'), app, jwtToken, apiDates)
        .then(successCB)
        .catch(errorCB);

    };
  };

  module.exports.getData = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          var dashboardData
            , summonsesTotal
            , repliedTotal
            , jurorReponseCount = 0
            , onlineResponseCount = 0
            , manualResponseCount
            , minYear
            , maxYear
            , yearLoop
            , yearList = []

          app.logger.info('Fetched and parsed dashboard totals: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: response,
          });

          summonsesTotal = response.cumulativeTotals.summonedTotal;
          repliedTotal = response.cumulativeTotals.respondedTotal;

          jurorReponseCount = response.thirdPtyResponseData.onlineResponseTotal - response.thirdPtyResponseData.thirdPtyOnlineResponseTotal;
          onlineResponseCount = response.mandatoryKpis.onlineResponsesTotal;
          manualResponseCount = onlineResponseCount - response.autoProcessedResponseData.autoProcessedOnlineResponseTotal;

          dashboardData = {
            historicTotals: getHistoricTotals(response),
            summonsesSent: {
              totalSentCount : summonsesTotal,
              totalSentFormatted: summonsesTotal.toLocaleString(),
              repliedCount: response.cumulativeTotals.respondedTotal,
              repliedFormatted: response.cumulativeTotals.respondedTotal.toLocaleString(),
              repliedPercent: getPercentageValue(summonsesTotal, response.cumulativeTotals.respondedTotal),
              notRepliedCount: response.cumulativeTotals.notRespondedTotal,
              notRepliedFormatted: response.cumulativeTotals.notRespondedTotal.toLocaleString(),
              notRepliedPercent: getPercentageValue(summonsesTotal, response.cumulativeTotals.notRespondedTotal),
            },
            responseMethod: {
              onlineTotal: response.mandatoryKpis.onlineResponsesTotal,
              onlineTotalFormatted: response.mandatoryKpis.onlineResponsesTotal.toLocaleString(),
              onlinePercent: getPercentageValue(repliedTotal, response.mandatoryKpis.onlineResponsesTotal),
              onlineWelsh: response.welshResponseData.welshOnlineResponseTotal,
              onlineWelshFormatted: response.welshResponseData.welshOnlineResponseTotal.toLocaleString(),
              onlineWelshPercent: Math.round(response.welshResponseData.percentWelshOnlineResponses),
              byPost: response.mandatoryKpis.paperResponsesTotal,
              byPostFormatted: response.mandatoryKpis.paperResponsesTotal.toLocaleString(),
              byPostPercent: getPercentageValue(repliedTotal, response.mandatoryKpis.paperResponsesTotal),
            },
            responseType: {
              jurorCount: jurorReponseCount,
              jurorFormatted: jurorReponseCount.toLocaleString(),
              jurorPercent: getPercentageValue(response.thirdPtyResponseData.onlineResponseTotal, jurorReponseCount),
              thirdPartyCount: response.thirdPtyResponseData.thirdPtyOnlineResponseTotal,
              thirdPartyFormatted: response.thirdPtyResponseData.thirdPtyOnlineResponseTotal.toLocaleString(),
              thirdPartyPercent: Math.round(response.thirdPtyResponseData.percentThirdPtyOnlineResponses),
            },
            automaticallyProcessed: {
              automaticCount: response.autoProcessedResponseData.autoProcessedOnlineResponseTotal,
              automaticFormatted: response.autoProcessedResponseData.autoProcessedOnlineResponseTotal.toLocaleString(),
              automaticPercent: Math.round(response.autoProcessedResponseData.percentAutoProcessedOnlineResponses),
              manualCount: manualResponseCount,
              manualFormatted: manualResponseCount.toLocaleString(),
              manualPercent: getPercentageValue(onlineResponseCount, manualResponseCount),
            },
            timeReceived: {
              within7DaysDigital: response.mandatoryKpis.onlineResponsesOverTime.within7days,
              within7DaysPaper: response.mandatoryKpis.paperResponsesOverTime.within7days,
              within7DaysTotalFormatted: '0',
              within7DaysPercent: Math.round(response.mandatoryKpis.percentResponsesWithin7days),

              within14DaysDigital: response.mandatoryKpis.onlineResponsesOverTime.within14days,
              within14DaysPaper: response.mandatoryKpis.paperResponsesOverTime.within14days,
              within14DaysTotalFormatted: '0',
              within14DaysPercent: Math.round(response.mandatoryKpis.percentResponsesWithin14days),

              within21DaysDigital: response.mandatoryKpis.onlineResponsesOverTime.within21days,
              within21DaysPaper: response.mandatoryKpis.paperResponsesOverTime.within21days,
              within21DaysTotalFormatted: '0',
              within21DaysPercent: Math.round(response.mandatoryKpis.percentResponsesWithin21days),

              over21DaysDigital: response.mandatoryKpis.onlineResponsesOverTime.over21days,
              over21DaysPaper: response.mandatoryKpis.paperResponsesOverTime.over21days,
              over21DaysTotalFormatted: '0',
              over21DaysPercent: Math.round(response.mandatoryKpis.percentResponsesOver21days),

              labels: ['Within 7 days\\n' + Math.round(response.mandatoryKpis.percentResponsesWithin7days) + '%\\n' + '(' + response.mandatoryKpis.allResponsesOverTime.within7days + ')'
                , 'Within 14 days\\n' + Math.round(response.mandatoryKpis.percentResponsesWithin14days) + '%\\n' + '(' + response.mandatoryKpis.allResponsesOverTime.within14days + ')'
                , 'Within 21 days\\n' + Math.round(response.mandatoryKpis.percentResponsesWithin21days) + '%\\n' + '(' + response.mandatoryKpis.allResponsesOverTime.within21days + ')'
                , 'Over 21 days\\n' + Math.round(response.mandatoryKpis.percentResponsesOver21days) + '%\\n' + '(' + response.mandatoryKpis.allResponsesOverTime.over21days + ')']
            }
          }

          // Process Smart Survey satisfaction totals
          
          surveyTotals.responsesTotal = response.surveyResponseData.responsesTotal;
          surveyTotals.verySatisfiedTotal = response.surveyResponseData.verySatisfiedTotal;
          surveyTotals.satisfiedTotal = response.surveyResponseData.satisfiedTotal;
          surveyTotals.neitherTotal = response.surveyResponseData.neitherSatisfiedOrDissatisfiedTotal;
          surveyTotals.dissatisfiedTotal = response.surveyResponseData.dissatisfiedTotal;
          surveyTotals.veryDissatisfiedTotal = response.surveyResponseData.veryDissatisfiedTotal;

          surveyTotals.verySatisfiedFormatted =  surveyTotals.verySatisfiedTotal.toLocaleString();
          surveyTotals.satisfiedFormatted =  surveyTotals.satisfiedTotal.toLocaleString();
          surveyTotals.neitherFormatted =  surveyTotals.neitherTotal.toLocaleString();
          surveyTotals.dissatisfiedFormatted =  surveyTotals.dissatisfiedTotal.toLocaleString();
          surveyTotals.veryDissatisfiedFormatted =  surveyTotals.veryDissatisfiedTotal.toLocaleString();

          surveyTotals.verySatisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.verySatisfiedTotal);
          surveyTotals.satisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.satisfiedTotal);
          surveyTotals.neitherPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.neitherTotal);
          surveyTotals.dissatisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.dissatisfiedTotal);
          surveyTotals.veryDissatisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.veryDissatisfiedTotal);

          surveyTotals.satifiedAndVerySatisfiedPercent = (surveyTotals.verySatisfiedPercent + surveyTotals.satisfiedPercent);
          surveyTotals.completedFeedbackPercent = getPercentageValue(dashboardData.responseMethod.onlineTotal, surveyTotals.responsesTotal);
          
          // Get data direct from the Smart Survey API for the user satisfaction chart
          //getSmartSurveyData(res, app, dashboardData);

          return res.render('./dashboard/index.njk', {
            dashboardData: dashboardData,
            dashboardDates: dashboardDates,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
          });

        }

        , errorCB = function(response) {

          if (typeof err !== 'undefined') {
            app.logger.crit('Failed to fetch dashboard information: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });
          } else if (typeof response !== 'undefined') {
            app.logger.crit('Failed to fetch dashboard information: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              response: response.error
            });
          }

          return res.render('./dashboard/index.njk', {
            dashboardData: null,
            dashboardDates: req.session.dashboardDates,
            dashboardYears: dashboardYears,
            errors: {
              message: '',
              count: 1,
              items: {
                api: {
                  summary: 'Error retrieving dashboard data'
                }
              }
            }
          });
        }

        , apiDates = {
          'startDate': '',
          'endDate': '',
        }
        , jwtToken
        , apiUserObj
        , validatorResult;

      dashboardDates = {
        'startMonth': req.body.startMonth,
        'startYear': req.body.startYear,
        'endMonth': req.body.endMonth,
        'endYear': req.body.endYear,
        'startDate': null,
        'endDate': null,
        'errorFlag': false,
        'errorMessage': ''
      };

      delete req.session.errors;
      delete req.session.dashboardDates;

      // Validate form submission
      validatorResult = validate(req.body, require('../../config/validation/dashboard.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.render('./dashboard/index.njk', {
          dashboardData: req.session.historicTotals,
          dashboardDates: dashboardDates,
          dashboardYears: dashboardYears,
          errors: {
            message: '',
            count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
            items: req.session.errors,
          }
        });

      }

      // Format search dates for API
      dashboardDates = getDateValues(req, dashboardDates);

      if (dashboardDates.error === true){
        delete req.session.dashboardDates;

        return res.render('./dashboard/index.njk', {
          dashboardData: null,
          dashboardDates: dashboardDates,
          dashboardYears: dashboardYears,
        });
      }

      apiDates = {
        'startDate': moment(dashboardDates.startDate).format('YYYY-MM-DD') + 'T00:00:00',
        'endDate': moment(dashboardDates.endDate).format('YYYY-MM-DD') + 'T00:00:00'
      }

      req.session.dashboardDates = dashboardDates;

      surveyExportResponsesRequired = 0;
      requireV1Survey = false;
      requireV2Survey = false;


      //f (moment(dashboardDates.startDate, 'YYYY-MM-DD', false).isBefore(moment('22/04/2020', 'DD/MM/YYYY', false))) {
      surveyExportResponsesRequired++;
      requireV1Survey = true;
      //}
      //if (moment(dashboardDates.endDate, 'YYYY-MM-DD', false).isAfter(moment('22/04/2020', 'DD/MM/YYYY', false))) {
      surveyExportResponsesRequired++;
      requireV2Survey = true;
      //}


      // Create user object for JWT
      apiUserObj = {
        login: 'AUTO',
        userLevel: '1',
        daysToExpire: 6,
        passwordWarning: true,
        staff: {
          name: 'AUTO',
          rank: -1,
          active: 1,
          courts: []
        }
      }

      // Create JWT
      jwtToken = jwt.sign(apiUserObj, secretsConfig.get('secrets.juror-digital-vault.bureau-jwtKey'), { expiresIn: secretsConfig.get('secrets.juror-digital-vault.bureau-jwtTTL') });

      // Clear session data
      delete req.session.formFields;
      delete req.session.errors;

      apiDates = {
        'startDate': dashboardDates.startDate + 'T00:00:00',
        'endDate': dashboardDates.endDate + 'T00:00:00',
      }

      dashboardObj
        .post(require('request-promise'), app, jwtToken, apiDates)
        .then(successCB)
        .catch(errorCB);


    };
  };


  function getSmartSurveyData(res, app, dashboardData) {
    var success = false


      , successExportIdV1 = function(response) {

        var i = 0,
          smartSurveyExportName;

        surveyExportIdV1 = 0;

        app.logger.info('Fetched v1 smart survey export details: ', {
          exportCount: response.length
        });

        smartSurveyExportName = config.smartSurveyExportV1;
        //smartSurveyExportName = 'Dashboard Export';

        if (response.length > 0){
          for (i = 0; i < response.length; i++) {
            if (response[i].name === smartSurveyExportName){
              surveyExportIdV1 = response[i].id;
              break;
            }
          }

          if (surveyExportIdV1 > 0){
            app.logger.info('Found matching V1 Export: ', {
              surveyExportIdV1: surveyExportIdV1
            });
            getSmartSurveyResponses(res, app, config.smartSurveyIdV1, surveyExportIdV1, config.smartSurveyExportV1, dashboardData, 1);
          } else {
            surveyTotals.surveyDataError = true;
            app.logger.info('Error finding matching V1 Export: ', {
              smartSurveyExportName: smartSurveyExportName
            });
          }

        }

        if (surveyTotals.surveyDataError === true && responseSent === false){
          responseSent = true;

          return res.render('./dashboard/index.njk', {
            dashboardData: dashboardData,
            dashboardDates: dashboardDates,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
          });
        }

        return true;

      }

      , successExportIdV2 = function(response) {

        var i = 0,
          smartSurveyExportName;

        surveyExportIdV2 = 0;

        app.logger.info('Fetched v2 smart survey export details: ', {
          exportCount: response.length
        });

        smartSurveyExportName = config.smartSurveyExportV2;

        if (response.length > 0){
          for (i = 0; i < response.length; i++) {
            if (response[i].name === smartSurveyExportName){
              surveyExportIdV2 = response[i].id;
              break;
            }
          }

          if (surveyExportIdV2 > 0){
            app.logger.info('Found matching V2 Export: ', {
              surveyExportIdV2: surveyExportIdV2
            });
            getSmartSurveyResponses(res, app, config.smartSurveyIdV2, surveyExportIdV2, config.smartSurveyExportV2, dashboardData, 2);
          } else {
            surveyTotals.surveyDataError = true;
            app.logger.info('Error finding matching V2 Export: ', {
              smartSurveyExportName: smartSurveyExportName
            });
          }

        }

        if (surveyTotals.surveyDataError === true && responseSent === false){
          responseSent = true;

          return res.render('./dashboard/index.njk', {
            dashboardData: dashboardData,
            dashboardDates: dashboardDates,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
          });
        }

        return true;

      }


      , errorCB = function(response) {

        if (typeof err !== 'undefined') {
          app.logger.crit('Failed to fetch smart survey export details: ', {
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
        } else if (typeof response !== 'undefined') {
          app.logger.crit('Failed to fetch smart survey export details: ', {
            response: response.error
          });
        }

        surveyTotals.surveyDataError = true;

        if (responseSent === false){

          responseSent = true;

          return res.render('./dashboard/index.njk', {
            dashboardData: dashboardData,
            dashboardDates: dashboardDates,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
          });
        }
      }

      , smartSurveyParams;

    surveyExportResponsesReceived = 0;
    surveyExportIdV1 = 0;
    surveyExportIdV2 = 0;
    surveyResponses = [];
    surveyTotals = {
      surveyDataError: false,
      responsesTotal:  0,
      verySatisfiedTotal: 0,
      satisfiedTotal: 0,
      neitherTotal: 0,
      dissatisfiedTotal: 0,
      veryDissatisfiedTotal: 0

    };

    responseSent = false;

    smartSurveyParams = '?api_token=' + secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyToken') + '&api_token_secret=' + secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyTokenSecret');

    if (requireV1Survey === true){
      smartSurveyExportObj
        .get(require('request-promise'), app, config.smartSurveyIdV1, secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyToken'), secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyTokenSecret'), smartSurveyParams)
        .then(successExportIdV1)
        .catch(errorCB);
    }

    if (requireV2Survey === true){
      smartSurveyExportObj
        .get(require('request-promise'), app, config.smartSurveyIdV2, secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyToken'), secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyTokenSecret'), smartSurveyParams)
        .then(successExportIdV2)
        .catch(errorCB);
    }
  }

  function getSmartSurveyResponses(res, app, surveyId, exportId, exportName, dashboardData, surveyVersion) {

    var success = false
      , arrData = []
      , i = 0
      , responseDate
      , responseRating

      , successCB = function(response) {
        app.logger.info('Fetched smart survey response data: ', {
          surveyId: surveyId,
          exportName: exportName,
          exportId: exportId
        });

        surveyExportResponsesReceived++;

        if (response.length > 1){

          arrData = parseCSV(response);

          app.logger.info('Survey response data received: ', {
            surveyId: surveyId,
            lineCount: arrData.length,
          });

          // process responses
          for (i = 1; i < arrData.length; i++) {

            if (surveyVersion === 1) {
              responseRating = arrData[i][8].trim().toLowerCase();
              responseDate = moment(arrData[i][7], 'DD/MM/YYYY', false);
            } else {
              responseRating = arrData[i][12].trim().toLowerCase();
              responseDate = moment(arrData[i][7], 'DD/MM/YYYY', false);
            }


            if (!(responseDate.isBefore(dashboardDates.startDate) || responseDate.isAfter(dashboardDates.endDate))){
            //if (responseDate.isValid()){

              switch (responseRating) {
              case 'very satisfied':
                surveyTotals.responsesTotal++;
                surveyTotals.verySatisfiedTotal++;
                break;
              case 'satisfied':
                surveyTotals.responsesTotal++;
                surveyTotals.satisfiedTotal++;
                break;
              case 'neither satisfied or dissatisfied':
                surveyTotals.responsesTotal++;
                surveyTotals.neitherTotal++;
                break;
              case 'dissatisfied':
                surveyTotals.responsesTotal++;
                surveyTotals.dissatisfiedTotal++;
                break;
              case 'very dissatisfied':
                surveyTotals.responsesTotal++;
                surveyTotals.veryDissatisfiedTotal++;
                break;
              default:
                // do nothing
                break;
              }
            }
          }

          surveyTotals.verySatisfiedFormatted =  surveyTotals.verySatisfiedTotal.toLocaleString();
          surveyTotals.satisfiedFormatted =  surveyTotals.satisfiedTotal.toLocaleString();
          surveyTotals.neitherFormatted =  surveyTotals.neitherTotal.toLocaleString();
          surveyTotals.dissatisfiedFormatted =  surveyTotals.dissatisfiedTotal.toLocaleString();
          surveyTotals.veryDissatisfiedFormatted =  surveyTotals.veryDissatisfiedTotal.toLocaleString();

          surveyTotals.verySatisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.verySatisfiedTotal);
          surveyTotals.satisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.satisfiedTotal);
          surveyTotals.neitherPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.neitherTotal);
          surveyTotals.dissatisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.dissatisfiedTotal);
          surveyTotals.veryDissatisfiedPercent =  getPercentageValue(surveyTotals.responsesTotal, surveyTotals.veryDissatisfiedTotal);

          if (surveyExportResponsesReceived === surveyExportResponsesRequired && responseSent === false){

            surveyTotals.satifiedAndVerySatisfiedPercent = (surveyTotals.verySatisfiedPercent + surveyTotals.satisfiedPercent);
            surveyTotals.completedFeedbackPercent = getPercentageValue(dashboardData.responseMethod.onlineTotal, surveyTotals.responsesTotal);

            responseSent = true;

            return res.render('./dashboard/index.njk', {
              dashboardData: dashboardData,
              dashboardDates: dashboardDates,
              dashboardYears: dashboardYears,
              surveyData: surveyTotals,
            });

          }

          return true;

        }

      }

      , errorCB = function(response) {

        surveyExportResponsesReceived++;

        if (typeof err !== 'undefined') {
          app.logger.crit('Failed to fetch smart survey reponse data: ', {
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
        } else if (typeof response !== 'undefined') {
          app.logger.crit('Failed to fetch smart survey resposne data: ', {
            response: response.error
          });
        }

        surveyTotals.surveyDataError = true;

        if (surveyExportResponsesReceived === surveyExportResponsesRequired && responseSent === false){

          responseSent = true;

          return res.render('./dashboard/index.njk', {
            dashboardData: dashboardData,
            dashboardDates: dashboardDates,
            dashboardYears: dashboardYears,
            surveyData: dashboardData,
          });
        }

      }

      , smartSurveyParams;


    smartSurveyParams = '?api_token=' + secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyToken') + '&api_token_secret=' + secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyTokenSecret');

    if (surveyTotals.surveyDataError === false){

      app.logger.info('Getting Smart Survey export: ', {
        surveyId: surveyId,
        exportName: exportName,
        exportId: exportId
      });

      smartSurveyResponseObj
        .get(require('request-promise'), app, surveyId, exportId, secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyToken'), secretsConfig.get('secrets.juror-digital-vault.bureau-smartSurveyTokenSecret'), smartSurveyParams)
        .then(successCB)
        .catch(errorCB);

    } else if (responseSent === false){

      responseSent = true;

      return res.render('./dashboard/index.njk', {
        dashboardData: dashboardData,
        dashboardDates: dashboardDates,
        dashboardYears: dashboardYears,
        surveyData: surveyTotals,
      });

    }

  }

  function getHistoricTotals(response) {
    var historicTotals
      , historicSummonsesSent = response.cumulativeTotals.totalNumberSummonsesSent
      , historicOnlineReplies = response.cumulativeTotals.totalNumberOnlineReplies;

    historicTotals = {
      summonsesSent: historicSummonsesSent,
      summonsesSentFormatted: historicSummonsesSent.toLocaleString(),
      onlineReplies: historicOnlineReplies,
      onlineRepliesFormatted: historicOnlineReplies.toLocaleString(),
      digitalTakeUpPercent: getPercentageValue(historicSummonsesSent, historicOnlineReplies)
    };

    return historicTotals;

  }

  function getPercentageValue(totalVal, val){
    var result = 0;

    if (totalVal > 0){
      result = Math.round((val / totalVal) * 100);
    } else {
      result = 0;
    }

    return result;

  }

  function getDateValues(req){

    dashboardDates.startMonth = req.body.startMonth.padStart(2, '0');
    dashboardDates.endMonth = req.body.endMonth.padStart(2, '0');
    dashboardDates.startDate = dashboardDates.startYear + '-' + dashboardDates.startMonth + '-01';
    dashboardDates.endDate = dashboardDates.endYear + '-' + dashboardDates.endMonth + '-01';


    if ((moment(dashboardDates.startDate, 'YYYY-MM-DD', true).isValid() === true) && (moment(dashboardDates.endDate, 'YYYY-MM-DD', true).isValid() === true)){
      dashboardDates.startDate = moment(dashboardDates.startDate).set('date', 1).format('YYYY-MM-DD');
      dashboardDates.startDateDisplay = moment(dashboardDates.startDate).format('MMMM YYYY');
      dashboardDates.endDate =  moment(dashboardDates.endDate).endOf('month').format('YYYY-MM-DD');
      dashboardDates.endDateDisplay =  moment(dashboardDates.endDate).format('MMMM YYYY');
      dashboardDates.error = false;
    } else {
      dashboardDates.error = true;
    }

    return dashboardDates;
  }

  function parseCSV(str) {
    var arr = []
      , row = 0
      , col = 0
      , c = 0
      , cc
      , nc
      , quote = false;  // true means we're inside a quoted field

    // iterate over each character, keep track of current row and column (of the returned array)
    for (row = 0, col = 0, c = 0; c < str.length; c++) {
      cc = str[c]
      nc = str[c+1];        // current character, next character
      arr[row] = arr[row] || [];             // create a new row if necessary
      arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

      // If the current character is a quotation mark, and we're inside a
      // quoted field, and the next character is also a quotation mark,
      // add a quotation mark to the current column and skip the next character
      if (cc === '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

      // If it's just one quotation mark, begin/end quoted field
      if (cc === '"') {quote = !quote; continue;}

      // If it's a comma and we're not in a quoted field, move on to the next column
      if (cc === ',' && !quote){
        ++col; continue;
      }

      // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
      // and move on to the next row and move to column 0 of that new row
      if (cc === '\r' && nc === '\n' && !quote) {
        ++row; col = 0; ++c; continue;
      }

      // If it's a newline (LF or CR) and we're not in a quoted field,
      // move on to the next row and move to column 0 of that new row
      if (cc === '\n' && !quote) {
        ++row; col = 0; continue;
      }
      if (cc === '\r' && !quote) {
        ++row; col = 0; continue;
      }

      // Otherwise, append the current character to the current column
      arr[row][col] += cc;
    }
    return arr;
  }


})();
