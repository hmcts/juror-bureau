;(function(){
  'use strict';

  var _ = require('lodash')
    , { backlogDAO, allocateBacklogDAO } = require('../../objects')
    , validate = require('validate.js')
    , assignRepliesValidator = require('../../config/validation/allocation')

  module.exports.index = function(app) {

    return function(req, res) {
      var totals = {
          allReplies: 0,
          nonUrgent: 0,
          urgent: 0,
          superUrgent: 0
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
          totals.superUrgent = response.bureauBacklogCount.superUrgent;
          totals.allReplies = response.bureauBacklogCount.allReplies;
          totals.modAllReplies = totals.nonUrgent + totals.urgent;
          //totals.allReplies = totals.nonUrgent + totals.urgent + totals.superUrgent;

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
      backlogDAO.get(req)
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
          superUrgent: 0,
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
          newTotals.superUrgent = apiResponse.bureauBacklogCount.superUrgent;
          newTotals.allReplies = apiResponse.bureauBacklogCount.allReplies;

          // JDB-4986 - only show warning message if backlog counts are lower than expected
          if ((newTotals.nonUrgent >= getCountInt(req.body.backlogNonUrgent)) &&
          (newTotals.urgent >= getCountInt(req.body.backlogUrgent)) &&
          (newTotals.superUrgent >= getCountInt(req.body.backlogSuperUrgent))){

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

      backlogDAO.get(req)
        .then(readSuccess)
        .catch(readError)
        .then(function(){
          if (rejectUpdate === false){
            payload = getAllocationList(req.body);
            allocateBacklogDAO.post(req, payload)
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
      , totalUrgent = 0
      , totalSuperUrgent = 0;

    staffList = [];

    responseData.forEach(function(obj) {
      staffList.push(
        {
          login: obj.login,
          name: obj.name,
          countNonUrgent: obj.nonUrgent,
          countUrgent: obj.urgent,
          countSuperUrgent: obj.superUrgent,
          countTotal: obj.allReplies
        }
      );

      // sort list alphabetically on name
      staffList.sort((a, b) => (a.name > b.name) ? 1 : -1);

      totalNonUrgent += obj.nonUrgent;
      totalUrgent += obj.urgent;
      totalSuperUrgent += obj.superUrgent;

    });

    staffData = {
      totalNonUrgent: totalNonUrgent,
      totalUrgent: totalUrgent,
      totalSuperUrgent: totalSuperUrgent,
      totalAll: totalNonUrgent + totalUrgent + totalSuperUrgent,
      officerList: staffList
    }

    return staffData;

  }

  function getAllocationList(responseData) {
    var allocationData
      , nonUrgentCount = getCountInt(responseData.allocateNonUrgent)
      , urgentCount = getCountInt(responseData.allocateUrgent)
      , superUrgentCount = getCountInt(responseData.allocateSuperUrgent)
      , selectedStaff = responseData.selectedstaff
      , index = 0
      , officerList=[];

    if ((!!selectedStaff) && (selectedStaff.constructor === Array)){
      for (index = 0; index < selectedStaff.length; index++) {
        officerList.push(
          {'userId': selectedStaff[index],
            'nonUrgentCount': nonUrgentCount,
            'urgentCount': urgentCount,
            'superUrgentCount': superUrgentCount
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
            'urgentCount': urgentCount,
            'superUrgentCount': superUrgentCount
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
