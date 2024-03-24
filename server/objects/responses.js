;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const moment = require('moment');

  const statusMapping = {
    TODO: function() {
      return 'To do';
    },
    AWAITING_CONTACT: function(hasModAccess = false) {
      if (hasModAccess) return 'Awaiting juror information';
      return 'Awaiting juror reply';
    },
    AWAITING_COURT_REPLY: function() {
      return 'Awaiting court reply';
    },
    AWAITING_TRANSLATION: function() {
      return 'Awaiting translation';
    },
    CLOSED: function() {
      return 'Completed';
    },
  };

  const getCountTransform = function(body) {
    return {
      todoCount: body.data.length,
      workCount: body.todoCount + body.repliesPendingCount,
    };
  };

  const getReplyType = function(responseData){
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

    return replyType;
  };

  const getAllTransform = function(hasModAccess) {
    return function(body) {
      var responseData = {
        items: [],
        counts: {
          todo: body.todoCount,
          pending: body.repliesPendingCount,
          completed: body.completedCount,
        },
      };

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
    };
  };

  module.exports.responsesDAO = new DAO('bureau/responses', {
    get: function(type, hasModAccess = false) {
      let urlPart;

      if (type === 'todo') {
        urlPart = 'todo';
      } else if (type === 'pending') {
        urlPart = 'pending';
      } else {
        urlPart = 'completedToday';
      }

      const uri = urljoin(this.resource, urlPart);

      return { uri, transform: getAllTransform(hasModAccess) };
    }}
  );

  module.exports.todoDAO = new DAO('bureau/responses/todo', {
    get: function(res, next) {
      const transform = (body) => {
        const resp = getCountTransform(body);

        res.locals.todoCount = resp.todoCount;
        res.locals.workCount = resp.workCount;
        next();
      };

      return { transform };
    }}
  );
})();
