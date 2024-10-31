;(function(){
  'use strict';

  var _ = require('lodash')
    , staffObj = require('../../objects/staff').object
    , staffRosterObj = require('../../objects/staff-roster').object
    , assignObj = require('../../objects/assign').object
    , assignMultiObj = require('../../objects/assign-multi').object
    , responseDetailObj = require('../../objects/response-detail').object
    , reallocateObj = require('../../objects/reallocate').object
    , responseOverviewObj = require('../../objects/response-overview').object
    , assignmentsMultiObj = require('../../objects/assignments-multi').object
    , teamObj = require('../../objects/team').object
    , validate = require('validate.js')
    , utils = require('../../lib/utils');

  // Staff list
  module.exports.index = function(app) {
    return function(req, res) {
      var activeStaff
        , inactiveStaff
        , selectedStaff
        , teamFilter
        , allStaff

        , successCB = function(staffList) {
          app.logger.info('Fetched list of staff:  ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: staffList,
          });

          activeStaff = _.sortBy(staffList.activeStaff, 'name');
          inactiveStaff = _.sortBy(staffList.inactiveStaff, 'name');

          if (teamFilter === 'active') {
            selectedStaff = activeStaff;
          } else {
            allStaff = activeStaff.concat(inactiveStaff);
            selectedStaff = _.sortBy(allStaff, 'name');
          }
          return res.render('staff/index', {
            staffMembers: selectedStaff,
            teamFilter: teamFilter,
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of staff members: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('inbox.todo.get'));
        };

      // store selection state

      if (req.session.manageTeamFilter) {
        teamFilter = req.session.manageTeamFilter;
      } else {
        teamFilter = 'active';
        req.session.manageTeamFilter = teamFilter;
      }

      // Clear session data
      delete req.session.searchResponse;
      delete req.session.formFields;
      delete req.session.errors;

      staffObj.get(require('request-promise'), app, req.session.authToken)
        .then(successCB)
        .catch(errorCB);
    };
  };

  // Staff Create GET
  module.exports.staffCreate = function(app) {
    return function(req, res) {
      var successCB = function(data) {
          var teamLeaderEnabled = false
            , activeEnabled = true
            , courtCount = 10;

          if (typeof req.session.formFields !== 'undefined') {
            teamLeaderEnabled = (req.session.formFields.teamLeader === 'Yes');
            activeEnabled = (req.session.formFields.active === 'Yes');
          }

          return res.render('staff/create', {
            formFields: req.session.formFields,
            teamLeaderEnabled: teamLeaderEnabled,
            activeEnabled: activeEnabled,
            courtCount: courtCount,
            teamList: data,
            errors: {
              title: 'Please check the form',
              message: '',
              count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
              items: req.session.errors,
            },
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of teams: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              login: req.params.login,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('staff.get'));
        };

      teamObj.getList(require('request-promise'), app, req.session.authToken)
        .then(successCB)
        .catch(errorCB);

    }
  };

  // Staff Create POST
  module.exports.staffCreatePost = function(app) {
    return function(req, res) {
      var validatorResult
        , teamValue
        , activeValue
        , postBody = {}
        , successCB = function(resp) {
          app.logger.info('Created new staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: postBody,
            response: resp,
          });

          return res.redirect(app.namedRoutes.build('staff.get'));
        }
        , failureCB = function(err) {
          app.logger.crit('Failed to create staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: postBody,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === 409) {
            // Username already taken
            req.session.formFields = req.body;
            req.session.errors = {
              login: [{
                summary: 'Please check the new staff member Juror application user name',
                details: 'This ' + err.error.message.replace(req.body.login + ' ', ''),
              }],
            }
          } else {
            req.session.errors = {
              login: [{
                summary: 'Error creating new staff member',
                details: err.error.message.replace(req.body.login + ' ', ''),
              }],
            }
          }

          return res.redirect(app.namedRoutes.build('staff.create.get'));
        };

      // Validate form submission
      validatorResult = validate(req.body, require('../../config/validation/staff-create.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('staff.create.get'));
      }

      // Clear session data
      delete req.session.formFields;
      delete req.session.errors;

      // set default active value
      if (typeof (req.body['active']) != 'undefined') {
        activeValue = req.body['active'];
      } else {
        activeValue = 'Yes';
      }

      // set default team value
      if (typeof (req.body['team']) != 'undefined') {
        teamValue = req.body['team'];
      } else {
        teamValue = '1';
      }

      // Structure data that goes to API
      postBody = {
        name: req.body['name'],
        login: req.body['login'],
        teamLeader: req.body['teamLeader'] === 'Yes',
        active: activeValue === 'Yes',
        team: parseInt(teamValue, 10),
        version: 0
      };


      // Send Create request
      staffObj.post(require('request-promise'), app, req.session.authToken, postBody)
        .then(successCB)
        .catch(failureCB);
    };
  };

  // Staff Edit GET
  module.exports.staffEdit = function(app) {
    return function(req, res) {
      var promiseArr = []
        , successCB = function(responseArr) {
          var teamLeaderEnabled = false
            , activeEnabled
            , activeTeam
            , courtCount = 10
            , staffDetails
            , staffData
            , teamData

          staffData = responseArr[0];
          teamData = responseArr[1];

          staffDetails = _.merge(staffData, req.session.formFields)

          app.logger.info('Fetched details of staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              login: req.params.login,
            },
            response: staffData,
          });

          // Add courts to array
          staffDetails.court = [
            staffDetails.court ? staffDetails.court[0] : staffDetails.court1,
            staffDetails.court ? staffDetails.court[1] : staffDetails.court2,
            staffDetails.court ? staffDetails.court[2] : staffDetails.court3,
            staffDetails.court ? staffDetails.court[3] : staffDetails.court4,
            staffDetails.court ? staffDetails.court[4] : staffDetails.court5,
            staffDetails.court ? staffDetails.court[5] : staffDetails.court6,
            staffDetails.court ? staffDetails.court[6] : staffDetails.court7,
            staffDetails.court ? staffDetails.court[7] : staffDetails.court8,
            staffDetails.court ? staffDetails.court[8] : staffDetails.court9,
            staffDetails.court ? staffDetails.court[9] : staffDetails.court10,
          ];

          // eslint-disable-next-line max-len
          activeTeam = (Object.prototype.hasOwnProperty.call(staffDetails.team, 'id')) ? staffDetails.team.id : staffDetails.team;
          teamLeaderEnabled = (staffDetails.teamLeader === 'Yes' || staffDetails.teamLeader === true);
          activeEnabled = (staffDetails.active === 'Yes' || staffDetails.active === true);

          return res.render('staff/edit', {
            originalLogin: req.params.login,
            formFields: staffDetails,
            teamLeaderEnabled: teamLeaderEnabled,
            activeEnabled: activeEnabled,
            courtCount: courtCount,
            activeTeam: activeTeam,
            teamList: teamData,
            errors: {
              title: 'Please check the form',
              message: '',
              count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
              items: req.session.errors,
            },
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch details of staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              login: req.params.login,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('staff.get'));
        };


      promiseArr.push(staffObj.getOne(require('request-promise'), app, req.session.authToken, req.params.login));
      promiseArr.push(teamObj.getList(require('request-promise'), app, req.session.authToken));
      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    }
  };

  // Staff Edit POST
  module.exports.staffEditPost = function(app) {
    return function(req, res) {
      var validatorResult
        , putBody = {}
        , teamValue
        , successCB = function(resp) {
          app.logger.info('Edited staff member', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              originalLogin: req.body['_login'],
              updatedStaff: putBody,
            },
            response: resp,
          });

          return res.redirect(app.namedRoutes.build('staff.get'));
        }
        , failureCB = function(err) {
          app.logger.crit('Failed to update staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              originalLogin: req.body['_login'],
              updatedStaff: putBody,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === 406) {
            // The staff profile inactive in the Juror application
            req.session.formFields = req.body;
            req.session.errors = {
              login: [{
                summary: 'The staff profile you are trying to activate has been made inactive in the Juror application. Please reactivate in Juror and then try again.',
                details: 'The staff profile you are trying to activate has been made inactive in the Juror application. Please reactivate in Juror and then try again.',
              }],
            }
          }

          if (err.statusCode === 409) {
            // Username already taken
            req.session.formFields = req.body;
            req.session.errors = {
              login: [{
                summary: 'The staff member that you are trying to update has been updated by someone else since you started this process. Please check the updated values and reapply your changes if necessary.',
                details: 'This ' + err.error.message.replace(req.body.login + ' ', ''),
              }],
            }
          }

          return res.redirect(app.namedRoutes.build('staff.edit.get', { login: req.body._login }));
        };


      // Validate form submission
      validatorResult = validate(req.body, require('../../config/validation/staff-edit.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('staff.edit.get', { login: req.body._login }));
      }

      // set default team value
      if (typeof (req.body['team']) != 'undefined') {
        teamValue = req.body['team'];
      } else {
        teamValue = '1';
      }

      // Structure data that goes to API
      putBody = {
        name: req.body['name'],
        teamLeader: req.body['teamLeader'] === 'Yes',
        active: req.body['active'] === 'Yes',
        team: parseInt(teamValue, 10),
        version: req.body.version
      };


      // Send Create request
      staffObj.put(require('request-promise'), app, req.session.authToken, req.body['_login'], putBody)
        .then(successCB)
        .catch(failureCB);
    };
  };


  // Assignment
  module.exports.getAssign = function(app) {
    return function(req, res) {
      var promiseArr = []
        , tmpErrors
        , tmpFields

        , successCB = function(response) {
          app.logger.info('Fetched list of staff and details of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            response: response,
          });

          tmpFields = _.cloneDeep(req.session.formFields);
          tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          const replyMethod = req.query.reply_method || 'digital';

          //return res.render('includes/send-to', {
          return res.render('response/process/send-to.njk', {
            staffMembers: response[0],
            responses: [response[1]],
            responseNames: [utils.getResponseNameDetails(response[1])],
            source: 'response',
            replyMethod,
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , errorCB = function(err) {
          var messageText = '';

          app.logger.crit('Failed to fetch list of staff and details of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          messageText = 'Failed to fetch list of staff and details of response';
          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': messageText}]
          }

          tmpFields = _.cloneDeep(req.session.formFields);
          tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          //return res.render('includes/send-to');
          return res.render('response/process/send-to.njk', {
            staffMembers: [],
            responses: [],
            responseNames: [],
            source: 'response',
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }

      promiseArr.push(staffRosterObj.get(require('request-promise'), app, req.session.authToken));
      promiseArr.push(responseDetailObj.get(require('request-promise'), app, req.session.authToken, req.params.id));

      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postAssign = function(app) {
    return function(req, res) {
      var validatorResult

        , successCB = function(response) {
          app.logger.info('Reassigned response to staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseJurorNumber: req.body.responseJurorNumber,
              assignTo: req.body.assignTo,
              version: req.body.version,
            },
            response: response,
          });

          /*return res.status(201).json({
            'message': 'success'
          });*/
          return res.redirect(app.namedRoutes.build('inbox.todo.get'));

        }
        , errorCB = function(err) {
          var messageText = '';

          app.logger.crit('Failed to reassign response to staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseJurorNumber: req.body.responseJurorNumber,
              assignTo: req.body.assignTo,
              version: req.body.version,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (parseInt(err.statusCode, 10) === 400) {
            messageText = 'The summons has been completed by another user. Your changes will not be saved.'
          } else {
            messageText = 'Could not update response';
          }

          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': messageText}]
          }

          //return res.status(err.statusCode).send(err);
          return res.redirect(app.namedRoutes.build('response.assign.get', {id: req.body.jurorNumber}));
        };

      delete req.session.errors;
      delete req.session.formFields;

      // Validate input
      validatorResult = validate(req.body, require('../../config/validation/send-to.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        //return res.status(400).json(validatorResult);
        return res.redirect(app.namedRoutes.build('response.assign.get', {id: req.body.jurorNumber}));
      }

      if (req.body.sendToOfficer === 'backlog'){
        req.body.sendToOfficer = '';
      }

      // eslint-disable-next-line max-len
      assignObj.post(require('request-promise'), app, req.session.authToken, req.body.jurorNumber, req.body.sendToOfficer, req.body.version)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getAssignMulti = function(app) {
    return function(req, res) {
      var promiseArr = []
        , selectedJurorNumbers = []
        , tmpErrors
        , tmpFields
        , validatorResult

        , successCB = function(response) {
          app.logger.info('Fetched list of staff and details of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseIdList: selectedJurorNumbers,
            },
            response: response,
          });

          tmpFields = _.cloneDeep(req.session.formFields);
          tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          req.session.sendToMulti = {};

          //return res.render('includes/send-to', {
          return res.render('response/process/send-to.njk', {
            staffMembers: response[1],
            responses: response[0],
            source: 'search',
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of staff and details of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              //responseIdList: req.params.jurorNumbers.split(','),
              responseIdList: selectedJurorNumbers,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          //return res.render('includes/send-to');

          tmpFields = _.cloneDeep(req.session.formFields);
          tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          return res.render('response/process/send-to.njk', {
            staffMembers: response[1],
            responses: response[0],
            source: 'search',
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        };


      if (!req.session.errors){
        // if no send-to page errors exist validate response selection from search page
        validatorResult = validate(req.body, require('../../config/validation/send-to-selection.js')(req));
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('search.get'));

        }
      }

      if (req.body.selectedResponses){
        if (Array.isArray(req.body.selectedResponses)){
          selectedJurorNumbers = req.body.selectedResponses;
        } else {
          selectedJurorNumbers = [req.body.selectedResponses];
        }
      } else {
        selectedJurorNumbers = req.session.sendToMulti.jurorNumbers
      }

      // store selected juror numbers in session
      req.session.sendToMulti = {};
      req.session.sendToMulti.jurorNumbers = selectedJurorNumbers;

      promiseArr.push(assignmentsMultiObj.post(require('request-promise'), app, req.session.authToken, selectedJurorNumbers));
      promiseArr.push(staffRosterObj.get(require('request-promise'), app, req.session.authToken));


      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  }

  module.exports.postAssignMulti = function(app) {
    return function(req, res) {
      var validatorResult
        , jurorNumbers = []
        , versionNumbers = []
        , responses = []
        , selectedJurorNumbers = []
        , index

        , successCB = function(response) {
          var failures = [];
            
          app.logger.info('Reassigned multiple responses to staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              assignTo: req.body.assignTo,
              responses: req.body.responses
            },
            response: response,
          });

          if (response.failures) {
            failures = response.failures.filter(function(failure) {

              return failure.reason === 'CLOSED';
            }).map(function(closed) {
              return closed.jurorNumber;
            });
          }

          /*return res.status(202).json({
            'message': 'success',
            failures: failures
          });*/
          return res.redirect(app.namedRoutes.build('search.get'));

        }
        , errorCB = function(err) {
          var messageText = '';

          app.logger.crit('Failed to reassign multiple responses to staff member: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              assignTo: req.body.assignTo,
              responses: req.body.responses
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (parseInt(err.statusCode, 10) === 400) {
            messageText = 'The summons has been completed by another user. Your changes will not be saved.'
          } else {
            messageText = 'Could not update response';
          }

          req.session.formFields = req.body;
          req.session.errors = {
            '': [{'details': messageText}]
          }

          req.session.sendToMulti = {};
          if (Array.isArray(req.body.jurorNumber)){
            selectedJurorNumbers = req.body.jurorNumber;
          } else {
            selectedJurorNumbers = [req.body.jurorNumber];
          }
          req.session.sendToMulti.jurorNumbers = selectedJurorNumbers;

          //return res.status(err.statusCode).send((typeof err.error !== 'undefined') ? err.error : err);
          return res.redirect(app.namedRoutes.build('response.assign.multi.selected.get'));
        };

      delete req.session.errors;
      delete req.session.formFields;

      // clear stored juror numbers from session
      req.session.sendToMulti = {};

      // Validate input
      validatorResult = validate(req.body, require('../../config/validation/send-to-multi.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        if (Array.isArray(req.body.jurorNumber)){
          selectedJurorNumbers = req.body.jurorNumber;
        } else {
          selectedJurorNumbers = [req.body.jurorNumber];
        }
        req.session.sendToMulti.jurorNumbers = selectedJurorNumbers;

        //return res.status(400).json(validatorResult);
        return res.redirect(app.namedRoutes.build('response.assign.multi.selected.get'));
      }

      // init response data for API
      jurorNumbers = req.body.jurorNumber;
      versionNumbers = req.body.version;

      if (Array.isArray(jurorNumbers)){
        for (index=0; index<jurorNumbers.length; index++){
          responses.push(
            {
              responseJurorNumber: jurorNumbers[index],
              version: versionNumbers[index]
            });
        }
      } else {
        responses = [
          {
            responseJurorNumber: jurorNumbers,
            version: versionNumbers
          }
        ]
      }

      if (req.body.sendToOfficer === 'backlog'){
        req.body.sendToOfficer = '';
      }

      assignMultiObj.post(req, req.body.sendToOfficer, responses)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postReallocation = function(app) {
    return function(req, res) {
      var successCB = function() {
          app.logger.info('Reallocated Users: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              pendingLogin: req.body.pendingLogin,
              staffToDeactivate: req.body.staffToDeactivate,
              todoLogin: req.body.todoLogin,
              urgentsLogin: req.body.urgentsLogin
            },
          });

          return res.status(201).json({
            'message': 'success'
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to reassign: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              pendingLogin: req.body.pendingLogin,
              staffToDeactivate: req.body.staffToDeactivate,
              todoLogin: req.body.todoLogin,
              urgentsLogin: req.body.urgentsLogin
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send((typeof err.error !== 'undefined') ? err.error : err);
        };

      reallocateObj.post(require('request-promise'), app, req.session.authToken, req.body.staffToDeactivate, req.body.pendingLogin, req.body.todoLogin, req.body.urgentsLogin)
        .then(successCB)
        .catch(errorCB);
    };
  };


  module.exports.getReallocate = function(app) {
    return function(req, res) {
      var promiseArr = []
        , successCB = function(response) {
          var staffList;
          var staffNameBeingDeactivated;

          app.logger.info('Fetched list of staff and details of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: response,
          });

          staffList = response[0].filter(function(staffMember) {
            return staffMember.login !== req.params.login;
          });

          staffNameBeingDeactivated = response[0].filter(function(staffMember) {
            return staffMember.login === req.params.login;
          });

          if (response[1].urgentsCount || response[1].pendingCount || response[1].todoCount) {
            return res.render('includes/staffInactive', {
              staffNameBeingDeactivated: staffNameBeingDeactivated[0],
              staffMembers: staffList,
              overview: response[1],
            });
          } else {
            return res.sendStatus(204);
          }
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of staff and details of response: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('includes/staffInactive');
        }

      promiseArr.push(staffRosterObj.get(require('request-promise'), app, req.session.authToken));
      promiseArr.push(responseOverviewObj.get(require('request-promise'), app, req.session.authToken, req.params.login));

      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    }
  }

  module.exports.staffFilterPost = function(app) {
    return function(req, res) {
      var activeStaff
        , inactiveStaff
        , selectedStaff
        , allStaff

        , successCB = function(staffList) {
          app.logger.info('Filtered team members: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: staffList,
          });

          activeStaff = _.sortBy(staffList.activeStaff, 'name');
          inactiveStaff = _.sortBy(staffList.inactiveStaff, 'name');

          if (req.session.manageTeamFilter === 'active') {
            selectedStaff = activeStaff;
          } else {
            allStaff = activeStaff.concat(inactiveStaff);
            selectedStaff = _.sortBy(allStaff, 'name');
          }

          return res.render('staff/index', {
            staffMembers: selectedStaff,
            teamFilter: req.session.manageTeamFilter,
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of staff members: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('staff.get'));
        };
      // Store team filter selection

      if (req.body.teamFilter) {
        req.session.manageTeamFilter = req.body.teamFilter;
      } else {
        req.session.manageTeamFilter = 'all';
      }

      // Clear session data
      delete req.session.searchResponse;
      delete req.session.formFields;
      delete req.session.errors;



      staffObj.get(require('request-promise'), app, req.session.authToken)
        .then(successCB)
        .catch(errorCB);
    };
  };

})();
