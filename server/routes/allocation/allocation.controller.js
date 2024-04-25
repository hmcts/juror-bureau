;(function(){
  'use strict';

  var _ = require('lodash')
    , backlogObj = require('../../objects/backlog').object
    , validate = require('validate.js')
    , assignRepliesValidator = require('../../config/validation/allocation')

  module.exports.index = function(app) {

    return function(req, res) {
      var totals = {
          allReplies: 0,
          nonUrgent: 0,
          urgent: 0
        }
        , officerList

        , successCB = function(response) {
          app.logger.info('Fetched backlog information: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: response,
          });

          totals.nonUrgent = response.bureauBacklogCount.nonUrgent;
          totals.urgent = response.bureauBacklogCount.urgent;
          totals.allReplies = response.bureauBacklogCount.allReplies;
          totals.modAllReplies = totals.nonUrgent + totals.urgent;

          officerList = getStaffList(response.bureauOfficerAllocatedReplies);

          return res.render('allocation/index.njk', {
            totals: totals,
            staffData: officerList,
            formFields: req.session.formFields,
            errors: {
              title: 'Please check the form',
              message: '',
              count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
              items: req.session.errors,
            },
          });
        }
        , errorCB = function(err) {
          if (typeof err !== 'undefined') {
            app.logger.crit('Failed to fetch backlog information: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });
          }

          return res.redirect(app.namedRoutes.build('inbox.todo.get'));
        }

      // Reset errors
      delete req.session.searchResponse;

      // Perform each request and then wait for all to resolve
      backlogObj.get(require('request-promise'), app, req.session.authToken)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var payload = { data: [] }
        , newTotals = {
          allReplies: 0,
          nonUrgent: 0,
          urgent: 0,
        }
        , rejectUpdate = true

        , modAccess = req.session.hasModAccess

        , validatorResult

        , updateSuccess = function(apiResponse) {
          app.logger.info('Allocated backlog items: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: apiResponse,
          });

          return res.redirect(app.namedRoutes.build('allocation.get'));
        }

        , updateError = function(apiResponse) {
          app.logger.info('Error allocating backlog items: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: apiResponse,
          });

          req.session.errors = {
            backlog: [{
              summary: 'Error processing the allocation',
              details: '',
            }],
          }

          return res.redirect(app.namedRoutes.build('allocation.get'));
        }

        , readError = function(err) {
          app.logger.crit('Failed to read backlog: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('allocation.get'));
        }

        , readSuccess = function(apiResponse) {
          app.logger.info('Fetched backlog information: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: apiResponse,
          });

          newTotals.nonUrgent = apiResponse.bureauBacklogCount.nonUrgent;
          newTotals.urgent = apiResponse.bureauBacklogCount.urgent;
          newTotals.allReplies = apiResponse.bureauBacklogCount.allReplies;

          // JDB-4986 - only show warning message if backlog counts are lower than expected
          if ((newTotals.nonUrgent >= getCountInt(req.body.backlogNonUrgent)) &&
          (newTotals.urgent >= getCountInt(req.body.backlogUrgent))){

            rejectUpdate = false;
            return;

          } else {
            // the backlog count is lower than expected due to a simultaneous allocation update
            // show warning message to user
            
            rejectUpdate = true;

            //officerList = getStaffList(apiResponse.bureauOfficerAllocatedReplies);

            req.session.errors = {
              allocateSuperUrgent: [{
                summary: 'There has been a change to the backlog since you loaded this page. Please resubmit the allocation.',
                details: 'There has been a change to the backlog since you loaded this page. Please resubmit the allocation.',
              }],
            }

            return res.redirect(app.namedRoutes.build('allocation.get'));

          }

        }

      // Reset errors
      delete req.session.errors;
      delete req.session.formFields;

      if (modAccess) {

        validatorResult = validate(req.body, assignRepliesValidator());
        if (typeof validatorResult !== 'undefined') {

          if (req.body.selectedstaff) {
            if (Array.isArray(req.body.selectedstaff)) {
              req.body.selectedStaffMembers = req.body.selectedstaff;
            } else {
              req.body.selectedStaffMembers = [req.body.selectedstaff];
            }
          }

          req.session.errors = validatorResult;
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('allocation.get'));
        }
      }

      backlogObj.get(require('request-promise'), app, req.session.authToken, rejectUpdate)
        .then(readSuccess)
        .catch(readError)
        .then(function(){
          if (rejectUpdate === false){
            payload = getAllocationList(req.body);
            backlogObj.post(require('request-promise'), app, req.session.authToken, payload)
              .then(updateSuccess)
              .catch(updateError);
          }
        });

    }
  };

  function getStaffList(responseData) {

    var staffData
      , staffList = []
      , totalNonUrgent = 0
      , totalUrgent = 0;

    staffList = [];

    responseData.forEach(function(obj) {
      staffList.push(
        {
          login: obj.login,
          name: obj.name,
          countNonUrgent: obj.nonUrgent,
          countUrgent: obj.urgent,
          countTotal: obj.allReplies
        }
      );

      // sort list alphabetically on name
      staffList.sort((a, b) => (a.name > b.name) ? 1 : -1);

      totalNonUrgent += obj.nonUrgent;
      totalUrgent += obj.urgent;

    });

    staffData = {
      totalNonUrgent: totalNonUrgent,
      totalUrgent: totalUrgent,
      totalAll: totalNonUrgent + totalUrgent,
      officerList: staffList
    }

    return staffData;

  }

  function getAllocationList(responseData) {
    var allocationData
      , nonUrgentCount = getCountInt(responseData.allocateNonUrgent)
      , urgentCount = getCountInt(responseData.allocateUrgent)
      , selectedStaff = responseData.selectedstaff
      , index = 0
      , officerList=[];

    if ((!!selectedStaff) && (selectedStaff.constructor === Array)){
      for (index = 0; index < selectedStaff.length; index++) {
        officerList.push(
          {'userId': selectedStaff[index],
            'nonUrgentCount': nonUrgentCount,
            'urgentCount': urgentCount
          }
        );
      }

      allocationData = {
        officerAllocations: officerList
      }

    } else {
      allocationData = {
        officerAllocations: [
          {
            'userId': selectedStaff,
            'nonUrgentCount': nonUrgentCount,
            'urgentCount': urgentCount
          }
        ]
      }
    }

    return allocationData;
  }

  function getCountInt(countValue){
    var count=0;

    if (isNaN(parseInt(countValue, 10))){
      count = 0;
    } else {
      count = parseInt(countValue, 10);
    }

    return count;
  }

})();
