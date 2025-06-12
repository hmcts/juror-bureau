;(function(){
  'use strict';

  const _ = require('lodash');
  const backlogObj = require('../../objects/backlog').object;
  const validate = require('validate.js');
  const assignRepliesValidator = require('../../config/validation/allocation');

  module.exports.index = (app) => async (req, res) => {
    let totals = {
      allReplies: 0,
      nonUrgent: 0,
      urgent: 0,
      awaitingInfo: 0,
    };

    // Reset errors
    delete req.session.searchResponse;

    try {
      let response = await backlogObj.get(req);

      console.log('\nResponse: \n', response, '\n\n');

      app.logger.info('Fetched backlog information: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        response,
      });

      totals.nonUrgent = response.bureauBacklogCount.nonUrgent;
      totals.urgent = response.bureauBacklogCount.urgent;
      totals.awaitingInfo = response.bureauBacklogCount.awaitingInfo;
      totals.allReplies = response.bureauBacklogCount.allReplies;
      totals.modAllReplies = totals.nonUrgent + totals.urgent;

      const officerList = getStaffList(response.bureauOfficerAllocatedReplies);

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
    } catch (err) {
      app.logger.crit('Failed to fetch backlog information: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.redirect(app.namedRoutes.build('inbox.todo.get'));
    }
  };



  // TODO: UPDATE CHECKS FOR CHANGES IN BACKLOG TO USE ETAG HEADERS RATHER THAN CHECKING THE TOTALS
  module.exports.post = (app) => async (req, res) => {
    let payload = { data: [] };
    let newTotals = {
      allReplies: 0,
      nonUrgent: 0,
      urgent: 0,
    };
    let rejectUpdate = true;
  
    // Reset errors
    delete req.session.errors;
    delete req.session.formFields;

    const validatorResult = validate(req.body, assignRepliesValidator());
    if (validatorResult) {
      if (req.body.selectedstaff) {
        req.body.selectedStaffMembers = Array.isArray(req.body.selectedstaff)
          ? req.body.selectedstaff
          : [req.body.selectedstaff];
      }

      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('allocation.get'));
    }
  
    try {
      const apiResponse = await backlogObj.get(req, rejectUpdate);
  
      app.logger.info('Fetched backlog information: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        response: apiResponse,
      });
  
      newTotals.nonUrgent = apiResponse.bureauBacklogCount.nonUrgent;
      newTotals.urgent = apiResponse.bureauBacklogCount.urgent;
      newTotals.allReplies = apiResponse.bureauBacklogCount.allReplies;
  
      // JDB-4986 - only show warning message if backlog counts are lower than expected
      if (
        newTotals.nonUrgent >= getCountInt(req.body.backlogNonUrgent) &&
        newTotals.urgent >= getCountInt(req.body.backlogUrgent)
      ) {
        rejectUpdate = false;
      } else {
        rejectUpdate = true;
  
        req.session.errors = {
          allocateSuperUrgent: [
            {
              summary:
                'There has been a change to the backlog since you loaded this page. Please resubmit the allocation.',
              details:
                'There has been a change to the backlog since you loaded this page. Please resubmit the allocation.',
            },
          ],
        };
  
        return res.redirect(app.namedRoutes.build('allocation.get'));
      }
  
      if (!rejectUpdate) {
        payload = getAllocationList(req.body);
        const postResponse = await backlogObj.post(req, payload);
  
        app.logger.info('Allocated backlog items: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          response: postResponse,
        });
  
        return res.redirect(app.namedRoutes.build('allocation.get'));
      }
    } catch (err) {
      if (rejectUpdate) {
        app.logger.crit('Failed to read backlog: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: err.error || err.toString(),
        });
      } else {
        app.logger.info('Error allocating backlog items: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          response: err,
        });
  
        req.session.errors = {
          backlog: [
            {
              summary: 'Error processing the allocation',
              details: '',
            },
          ],
        };
      }
  
      return res.redirect(app.namedRoutes.build('allocation.get'));
    }
  };
 

  const getStaffList = (responseData) => {
    let staffData;
    let staffList = [];
    let totalNonUrgent = 0;
    let totalUrgent = 0;
    let totalAwaitingInfo = 0;
    let totalAll = 0;

    staffList = [];

    responseData.forEach((obj) => {
      staffList.push({
        login: obj.login,
        name: obj.name,
        countNonUrgent: obj.nonUrgent,
        countUrgent: obj.urgent,
        countAwaitingInfo: obj.awaitingInfo,
        countTotal: obj.allReplies,
      });

      // sort list alphabetically on name
      staffList.sort((a, b) => (a.name > b.name ? 1 : -1));

      totalNonUrgent += obj.nonUrgent;
      totalUrgent += obj.urgent;
      totalAwaitingInfo += obj.awaitingInfo;
      totalAll += obj.allReplies;
    });

    staffData = {
      totalNonUrgent,
      totalUrgent,
      totalAwaitingInfo,
      totalAll,
      officerList: staffList,
    };

    return staffData;
  };

  const getAllocationList = (responseData) => {
    let allocationData;
    let nonUrgentCount = getCountInt(responseData.allocateNonUrgent);
    let urgentCount = getCountInt(responseData.allocateUrgent);
    let selectedStaff = responseData.selectedstaff;
    let index = 0;
    let officerList = [];

    if (Array.isArray(selectedStaff)) {
      for (index = 0; index < selectedStaff.length; index++) {
        officerList.push({
          userId: selectedStaff[index],
          nonUrgentCount: nonUrgentCount,
          urgentCount: urgentCount,
        });
      }

      allocationData = {
        officerAllocations: officerList,
      };
    } else {
      allocationData = {
        officerAllocations: [
          {
            userId: selectedStaff,
            nonUrgentCount: nonUrgentCount,
            urgentCount: urgentCount,
          },
        ],
      };
    }

    return allocationData;
  };

  const getCountInt = (countValue) => {
    let count = 0;

    if (isNaN(parseInt(countValue, 10))) {
      count = 0;
    } else {
      count = parseInt(countValue, 10);
    }

    return count;
  };

})();
