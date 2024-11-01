;(function(){
  'use strict';

  var {dashboardStats} = require('../../objects/dashboard'),
    secretsConfig = require('config'),
    jwt = require('jsonwebtoken'),
    moment = require('moment'),
    validate = require('validate.js'),
    dashboardYears = [],
    surveyTotals = {
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
      completedFeedbackPercent: 0,
    }
    , dashboardDates = {
      'startMonth': null,
      'startYear': null,
      'endMonth': null,
      'endYear': null,
      'startDate': null,
      'endDate': null,
      'errorFlag': false,
      'errorMessage': '',
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
            historicTotals: getHistoricTotals(response),
          };

          return res.render('./dashboard/index.njk', {
            dashboardData: req.session.historicTotals,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
            errors: null,
          });
        }

        , errorCB = function(errResponse) {

          req.session.historicTotals = null;

          app.logger.info('Error retrieving dashboard data', errResponse);

          apiError = {
            items: {
              api: {
                summary: 'Error retrieving dashboard data',
              },
            },
          };

          req.session.errors = apiError;

          return res.render('./dashboard/index.njk', {
            dashboardData: null,
            dashboardYears: dashboardYears,
            surveyData: surveyTotals,
            errors: req.session.errors,
          });
        }

        , apiDates = {
          'startDate': '',
          'endDate': '',
        }
        , jwtToken
        , apiUserObj;

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
          courts: [],
        },
      };

      // Create JWT
      jwtToken = jwt.sign(apiUserObj,
        secretsConfig.get('secrets.juror.bureau-jwtKey'),
        { expiresIn: secretsConfig.get('secrets.juror.bureau-jwtTTL') });

      // Create a date range based on current date
      // a date range is not required for the API to return the historic values
      apiDates = {
        'startDate': moment().format('YYYY-MM-DD') + 'T00:00:00',
        'endDate': moment().format('YYYY-MM-DD') + 'T00:00:00',
      };


      dashboardStats.post(jwtToken, apiDates)
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
            , manualResponseCount;

          app.logger.info('Fetched and parsed dashboard totals: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: response,
          });

          summonsesTotal = response.cumulativeTotals.summonedTotal;
          repliedTotal = response.cumulativeTotals.respondedTotal;

          // eslint-disable-next-line max-len
          jurorReponseCount = response.thirdPtyResponseData.onlineResponseTotal - response.thirdPtyResponseData.thirdPtyOnlineResponseTotal;
          onlineResponseCount = response.mandatoryKpis.onlineResponsesTotal;
          manualResponseCount =
            onlineResponseCount - response.autoProcessedResponseData.autoProcessedOnlineResponseTotal;

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

              labels: [
                'Within 7 days: ' +
                Math.round(response.mandatoryKpis.percentResponsesWithin7days) +
                '% (' + response.mandatoryKpis.allResponsesOverTime.within7days + ')',

                'Within 14 days: ' +
                  Math.round(response.mandatoryKpis.percentResponsesWithin14days) +
                  '% (' + response.mandatoryKpis.allResponsesOverTime.within14days + ')',

                'Within 21 days: ' +
                Math.round(response.mandatoryKpis.percentResponsesWithin21days) +
                '% (' + response.mandatoryKpis.allResponsesOverTime.within21days + ')',

                'Over 21 days: ' +
                Math.round(response.mandatoryKpis.percentResponsesOver21days) +
                '% (' + response.mandatoryKpis.allResponsesOverTime.over21days + ')',
              ],
            },
          };

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

          surveyTotals.verySatisfiedPercent =
            getPercentageValue(surveyTotals.responsesTotal, surveyTotals.verySatisfiedTotal);
          surveyTotals.satisfiedPercent =
            getPercentageValue(surveyTotals.responsesTotal, surveyTotals.satisfiedTotal);
          surveyTotals.neitherPercent =
            getPercentageValue(surveyTotals.responsesTotal, surveyTotals.neitherTotal);
          surveyTotals.dissatisfiedPercent =
            getPercentageValue(surveyTotals.responsesTotal, surveyTotals.dissatisfiedTotal);
          surveyTotals.veryDissatisfiedPercent =
            getPercentageValue(surveyTotals.responsesTotal, surveyTotals.veryDissatisfiedTotal);

          surveyTotals.satifiedAndVerySatisfiedPercent =
            (surveyTotals.verySatisfiedPercent + surveyTotals.satisfiedPercent);
          surveyTotals.completedFeedbackPercent =
            getPercentageValue(dashboardData.responseMethod.onlineTotal, surveyTotals.responsesTotal);

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
              response: response.error,
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
                  summary: 'Error retrieving dashboard data',
                },
              },
            },
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
        'errorMessage': '',
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
          },
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
        'endDate': moment(dashboardDates.endDate).format('YYYY-MM-DD') + 'T00:00:00',
      };

      req.session.dashboardDates = dashboardDates;

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
          courts: [],
        },
      };

      // Create JWT
      jwtToken = jwt.sign(apiUserObj,
        secretsConfig.get('secrets.juror.bureau-jwtKey'),
        { expiresIn: secretsConfig.get('secrets.juror.bureau-jwtTTL') });

      // Clear session data
      delete req.session.formFields;
      delete req.session.errors;

      apiDates = {
        'startDate': dashboardDates.startDate + 'T00:00:00',
        'endDate': dashboardDates.endDate + 'T00:00:00',
      };

      dashboardStats.post(jwtToken, apiDates)
        .then(successCB)
        .catch(errorCB);

    };
  };

  function getHistoricTotals(response) {
    var historicTotals
      , historicSummonsesSent = response.cumulativeTotals.totalNumberSummonsesSent
      , historicOnlineReplies = response.cumulativeTotals.totalNumberOnlineReplies;

    historicTotals = {
      summonsesSent: historicSummonsesSent,
      summonsesSentFormatted: historicSummonsesSent.toLocaleString(),
      onlineReplies: historicOnlineReplies,
      onlineRepliesFormatted: historicOnlineReplies.toLocaleString(),
      digitalTakeUpPercent: getPercentageValue(historicSummonsesSent, historicOnlineReplies),
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


    if ((moment(dashboardDates.startDate, 'YYYY-MM-DD', true).isValid() === true)
      && (moment(dashboardDates.endDate, 'YYYY-MM-DD', true).isValid() === true)){
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

})();
