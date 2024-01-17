;(function(){
  'use strict';

  var _ = require('lodash')
    , moment = require('moment')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform
    }

    , statusMapping = {
      TODO: function() {
        return 'To do'
      },
      AWAITING_CONTACT: function(hasModAccess = false) {
        if (hasModAccess) return 'Awaiting juror information';
        return 'Awaiting juror reply'
      },
      AWAITING_COURT_REPLY: function() {
        return 'Awaiting court reply'
      },
      AWAITING_TRANSLATION: function() {
        return 'Awaiting translation'
      },
      CLOSED: function() {
        return 'Completed'
      },
    }

    , getCountTransform = function(body) {
      // Verify we have a data field
      if (body.hasOwnProperty('data') === false) {
        return 0;
      }

      return {
        todoCount: body.data.length,
        workCount: body.todoCount + body.repliesPendingCount
      }

    }

    , getReplyType = function(responseData){
      var replyType = ''
        , isExcusal = false
        , isDeferral = false
        , isIneligible = false
        , valYes = 'Y'
        , valNo = 'N';

      if (responseData.processingStatus === 'TODO'){
        if (responseData.excusalReason){
          isExcusal = true;
        }

        if (responseData.deferralDate){
          isDeferral = true;
        }

        if (responseData.bail === valYes ||
          responseData.residency === valNo ||
          responseData.convictions === valYes ||
          responseData.mentalHealthAct === valYes) {
          isIneligible = true;
        }
      }

      if (isIneligible){
        replyType = 'INELIGIBLE';
      } else if (isExcusal){
        replyType = 'EXCUSAL';
      } else if (isDeferral){
        replyType = 'DEFERRAL';
      } else {
        replyType = 'NEEDS REVIEW';
      }

      return replyType
    }

    , getAllTransform = function(hasModAccess) {
      return function(body) {
        var responseData = {
          items: [],
          counts: {
            todo: body.todoCount,
            pending: body.repliesPendingCount,
            completed: body.completedCount,
          },
        };

        // Verify we have a data field
        if (body.hasOwnProperty('data') === false) {
          return false;
        }


        // Begin transforming data
        body.data.forEach(function(response) {
          var newObj = {
            jurorNumber: response.jurorNumber,

            title: response.title,
            firstName: response.firstName,
            lastName: response.lastName,
            displayName: [
              response.title,
              response.firstName,
              response.lastName,
            ].filter(function(val) {
              return val;
            }).join(' '),

            courtName: response.courtName,
            replyType: getReplyType(response),

            processingStatus: statusMapping.hasOwnProperty(response.processingStatus) ?
              statusMapping[response.processingStatus](hasModAccess) :
              '',
            poolNumber: response.poolNumber,

            urgent: response.urgent,
            superUrgent: response.superUrgent,
            slaOverdue: response.slaOverdue,
            isUrgent: (response.superUrgent || response.urgent),

            rawReceivedAt: response.dateReceived,
            receivedAt: moment(response.dateReceived).format('DD/MM/YYYY'),
            receivedAtTime: moment(response.dateReceived).format('HH:mm'),
            rawCompletedAt: response.completedAt,
            completedAt: moment(response.completedAt).format('DD/MM/YYYY'),
            completedAtTime: moment(response.completedAt).format('HH:mm'),
          };

          responseData.items.push(newObj);
        });

        return responseData;
      }
    }


    , responseObject = {
      resource: 'bureau/responses',
      query: function(rp, app, jwtToken, type, hasModAccess = false) {
        var reqOptions = _.clone(options)
          , urlPart;

        if (type === 'todo') {
          urlPart = 'todo';
        } else if (type === 'pending') {
          urlPart = 'pending';
        } else {
          urlPart = 'completedToday';
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, urlPart);
        reqOptions.transform = getAllTransform(hasModAccess);

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      getCount: function(req, res, next) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = req.session.authToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(reqOptions.uri, 'bureau/responses/todo');
        reqOptions.transform = getCountTransform;

        this.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        require('request-promise')(reqOptions)
          .then(function(resp) {
            res.locals.todoCount = resp.todoCount;
            res.locals.workCount = resp.workCount;
            next();
          });
      }
    };


  module.exports.getAllTransform = getAllTransform;

  module.exports.object = responseObject;

})();
