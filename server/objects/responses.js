;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const moment = require('moment');
  const urljoin = require('url-join');

  const statusMapping = {
    TODO: function() {
      return 'To do'
    },
    AWAITING_CONTACT: function() {
      return 'Awaiting juror information';
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
  };

  const getCountTransform = function(body) {
    return {
      todoCount: body.todo_count,
      workCount: body.work_count
    }
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

    return replyType
  };

  const getAllTransform = function() {
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
          replyMethod: response.replyMethod,

          processingStatus: statusMapping.hasOwnProperty(response.processingStatus) ?
            statusMapping[response.processingStatus]() :
            '',
          poolNumber: response.poolNumber,
          urgent: response.urgent,
          superUrgent: response.superUrgent,
          slaOverdue: response.slaOverdue,
          isUrgent: (response.superUrgent || response.urgent),
          receivedAt: response.dateReceived,
          completedAt: response.completedAt,
          completedAtTime: moment(response.completedAt).format('HH:mm'),
        };

        responseData.items.push(newObj);
      });

      return responseData;
    }
  };

  module.exports.getAllTransform = getAllTransform;

  module.exports.object = {
    resource: 'bureau/responses',
    query: function(req, type) {
      let urlPart;

      if (type === 'todo') {
        urlPart = 'todo';
      } else if (type === 'pending') {
        urlPart = 'pending';
      } else {
        urlPart = 'completedToday';
      }

      const uri = urljoin(this.resource, urlPart);

      const dao = new DAO(uri, {
        get: function() {
          return {
            uri: this.resource,
            transform: getAllTransform(),
          }
        }
      });

      return dao.get(req);
    },
    getCount: function(req, res, next) {
        const uri = 'bureau/responses/counts';

        const dao = new DAO(uri, {
          get: function() {
            return {
              uri: this.resource,
              transform: getCountTransform,
            }
          }
        });

        dao.get(req)
          .then(function(resp) {
            res.locals.todoCount = resp.todoCount;
            res.locals.workCount = resp.workCount;
            next();
          });
    },
  };

})();
