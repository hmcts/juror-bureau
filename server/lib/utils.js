;(function() {
  'use strict';

  var fse = require('fs-extra')
    , _ = require('lodash')
    , searchObj = require('../objects/search').searchResponsesDAO;


  /// Will require HTTP basic auth username and password
  module.exports.basicAuth = function(logger, username, password, basicAuthObj) {
    return function(req, res, next) {
      var user;

      if (!username || !password) {
        logger.fatal('Username or password is not set for basic auth.');
        return res.status(401).render('_errors/noauth.njk');
      }

      user = basicAuthObj(req);
      if (!user || user.name !== username || user.pass !== password) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
      }

      return next();
    };
  };


  /// If non HTTPS request is made this will redirect to HTTPS at the same URL
  module.exports.forceHttps = function(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      // 302 temporary - this is a feature that can be disabled
      return res.redirect(302, 'https://' + req.get('Host') + req.url);
    }
    return next();
  };


  /// Function to sort responses by ascending date.
  /// additionally ensures urgent replies are at top
  ///
  /// @param {array} data Array of data to be sorted
  /// @param {string} trumpField A field which value is boolean, a truthy on trump field will move to top of list
  module.exports.sortResponseData = function(data, sortField, reverse) {
    var itemObj = {
        superUrgent: [],
        urgent: [],
        todo: [],
      }
      , finalObj;


    // Separate superUrgent, urgent and todo. These are prioritized separately.
    data.forEach(function(item) {
      if (item.superUrgent === true) {
        itemObj.superUrgent.push(item);
      } else if (item.urgent === true) {
        itemObj.urgent.push(item);
      } else {
        itemObj.todo.push(item);
      }
    });


    // Oldest to youngest
    itemObj.superUrgent = _.sortBy(itemObj.superUrgent, sortField);
    itemObj.urgent = _.sortBy(itemObj.urgent, sortField);
    itemObj.todo = _.sortBy(itemObj.todo, sortField);


    // Merge for final output
    finalObj = _.concat(itemObj.superUrgent, itemObj.urgent, itemObj.todo);


    // If reverse set, then flip it
    if (typeof reverse !== 'undefined' && reverse === true) {
      finalObj.reverse();
    }


    // All done
    return finalObj;
  };

  module.exports.sortCompletedResponseData = function(data, sortField, reverse) {
    var finalObj;

    // Oldest to youngest
    finalObj = _.sortBy(data, sortField);

    // If reverse set, then flip it
    if (typeof reverse !== 'undefined' && reverse === true) {
      finalObj.reverse();
    }


    // All done
    return finalObj;
  };

  /// Function to check for existence of a directory and will
  /// create it if not present.
  ///
  /// @param {string}   dir   The directory path to be checked
  module.exports.checkDirectoryCreate = function(dir) {
    try {
      fse.ensureDirSync(dir);
      return true;
    } catch (exception) {
      return false;
    }
  };

  const remapCase = function(object, process) {
    if (Array.isArray(object)) {
      return object.map((item) => remapCase(item, process));
    }

    if (object === null) {
      return null;
    }

    if (typeof object === 'object') {
      const out = {};

      Object.keys(object).forEach(key => {
        out[process(key)] = remapCase(object[key], process);
      });

      return out;
    }

    return object;
  };

  module.exports.basicDataTransform = function(object, key) {
    var activeKey = key;

    // Ensure key has a default value
    if (typeof activeKey !== 'string') {
      activeKey = 'data';
    }

    // If object has key then return the given key
    if (typeof object === 'object' && Object.prototype.hasOwnProperty.call(object, activeKey)) {
      return object[activeKey];
    }

    // Otherwise return the object as-is.
    return object;
  };


  module.exports.searchResponses = function(req, app, searchValues) {
    return new Promise(function(resolve, reject) {
      var searchParams = {
          jurorNumber: (searchValues['jurorNumber']) ? searchValues['jurorNumber'] : null,
          lastName: (searchValues['lastName']) ? searchValues['lastName'] : null,
          poolNumber: (searchValues['poolNumber']) ? searchValues['poolNumber'] : null,
          postCode: (searchValues['postcode']) ? searchValues['postcode'] : null,
          courtCode: (searchValues['courtCode']) ? searchValues['courtCode'] : null,
          staffAssigned: (typeof searchValues['staffAssigned'] !== 'undefined' && searchValues['staffAssigned']) ?
            searchValues['staffAssigned'] :
            null,
          urgentsOnly: (
            searchValues['urgentsOnly'] === true ||
            searchValues['urgentsOnly'] === 'true' ||
            searchValues['urgentsOnly'] === 'urgentsOnly') ? true : false,
        }
        , statusMapping = {
          TODO: 'To do',
          AWAITING_CONTACT: 'Awaiting juror',
          AWAITING_COURT_REPLY: 'Awaiting court reply',
          AWAITING_TRANSLATION: 'Awaiting translation',
          CLOSED: 'Completed',
        }
        , iParam
        , iStatus
        , paramsUsed = []
        , resultsStr = ''
        , tmpStr
        , sortedData = []
        , sortField
        , isUrgent
        , urgentTrue
        , hasStatus = false
        , multipleStatus = false
        , statusArr = []

        , successCB = function(response) {
          app.logger.info('Fetched and parsed search results', {
            userId: req.session.authentication.login,
            searchParams: searchParams,
          });


          // Get field to sort by
          sortField = searchValues['sortBy'] ? searchValues['sortBy'] : 'dateReceived';
          if (sortField === 'dateReceived') {
            sortField = 'rawDateReceived';
          }

          // Sort results
          sortedData = _.sortBy(response.data, function(obj) {
            if (sortField === 'jurorNumber' || sortField === 'poolNumber') {
              return parseInt(obj[sortField], 10);
            }

            return obj[sortField];
          });

          // Reverse if needed
          if (searchValues['sortOrder'] === 'DESC') {
            sortedData.reverse();
          }

          resolve({
            status: 200,
            results: sortedData,
            meta: response.meta,
            searchParams: searchParams,
            resultsStr: resultsStr,
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch and parse search result', {
            userId: req.session.authentication.login,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          reject({
            status: err.statusCode,
            results: [],
            meta: {},
            searchParams: searchParams,
            resultsStr: '',
          });
        };


      // Build array of status searches
      if (searchValues['status']){
        if (typeof searchValues['status'] === 'string' && searchValues['status'].length > 0) {
          statusArr.push(searchValues['status']);

          searchParams.status = statusArr;
        } else if (typeof searchValues['status'] === 'object') {
          searchValues['status'].forEach(function(status) {
            statusArr.push(status);
          });

          searchParams.status = statusArr;

        }
      }

      // Build string for what has been searched
      iParam = 0;
      for (iParam; iParam < Object.keys(searchParams).length; iParam += 1) {
        if (
          searchParams[Object.keys(searchParams)[iParam]] !== null &&
          (
            Object.keys(searchParams)[iParam] !== 'urgentsOnly' ||
            searchParams[Object.keys(searchParams)[iParam]] === true
          )
        ) {
          paramsUsed.push({
            key: Object.keys(searchParams)[iParam],
            value: searchParams[Object.keys(searchParams)[iParam]],
          });
        }
      }


      iParam = 0;
      for (iParam; iParam < paramsUsed.length; iParam += 1) {
        isUrgent = (paramsUsed[iParam].key === 'urgentsOnly');
        urgentTrue = (isUrgent && paramsUsed[iParam].value === true);
        hasStatus = _.findIndex(paramsUsed, { key: 'status' });
        multipleStatus = (hasStatus !== -1 && paramsUsed[hasStatus].value.length > 1);

        if (iParam > 0 && (paramsUsed.length > 2 || multipleStatus) && (iParam < paramsUsed.length - 1 || (hasStatus > -1 || multipleStatus))) {
          resultsStr += ', ';
        }

        if (iParam > 0 && iParam === paramsUsed.length - 1 && (hasStatus === -1 || multipleStatus === false)) {
          resultsStr += ' and ';
        }

        if (isUrgent) {
          resultsStr += urgentTrue ? '&ldquo;Urgent&rdquo;' : '';
        } else if (paramsUsed[iParam].key === 'status') {
          iStatus = 0;
          tmpStr = '';
          for (iStatus; iStatus < paramsUsed[iParam].value.length; iStatus += 1) {
            if (iStatus > 0 && iStatus < paramsUsed[iParam].value.length - 1) {
              tmpStr += ', ';
            }

            if (iStatus > 0 && iStatus === paramsUsed[iParam].value.length - 1) {
              tmpStr += ' and ';
            }

            tmpStr += '&ldquo;' + statusMapping[paramsUsed[iParam].value[iStatus]] + '&rdquo;';
          }

          resultsStr += tmpStr;
        } else {
          resultsStr += '&ldquo;' + paramsUsed[iParam].value + '&rdquo;';
        }
      }


      if (typeof searchParams.status === 'undefined') {
        searchParams.status = null;
      }

      searchObj.get(req, searchParams)
        .then(successCB)
        .catch(errorCB);
    });
  };

  module.exports.getResponseAlert = function(responseItem) {
    var alertData;

    // init alert data
    alertData = {}

    if (responseItem.superUrgent) {
      alertData.alertText = 'SEND TO COURT';
      alertData.alertSort = '3';
    } else if (responseItem.urgent) {
      alertData.alertText = 'URGENT';
      alertData.alertSort = '2';
    } else if (responseItem.slaOverdue) {
      alertData.alertText = 'OVERDUE';
      alertData.alertSort = '1';
    } else {
      alertData.alertText = '';
      alertData.alertSort = '0';
    }

    return alertData;

  }

  module.exports.getResponseNameDetails = function(data) {
    var newNameRender = [data.newTitle, data.newFirstName, data.newLastName].filter(function(val) {
        return val;
      }).join(' ')

      , nameRender = [data.title, data.firstName, data.lastName].filter(function(val) {
        return val;
      }).join(' ')

      , hasNewName = (
        data.newTitle !== data.title ||
        data.newFirstName !== data.firstName ||
        data.newLastName !== data.lastName
      );

    return {
      changed: (hasNewName === true),
      currentName: (hasNewName) ? newNameRender : nameRender,
      oldName: (hasNewName) ? nameRender : null,
      //headerNameRender: (hasNewName) ? newNameRender.replace(data.newTitle+' ', '') : nameRender.replace(data.title+' ', ''),
      headerNameRender: (hasNewName) ? newNameRender : nameRender,
      title: (hasNewName) ? data.newTitle : data.title,
      firstName: (hasNewName) ? data.newFirstName : data.firstName,
      lastName: (hasNewName) ? data.newLastName : data.lastName,
    };
  }

})();
