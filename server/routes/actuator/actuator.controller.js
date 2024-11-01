;(function(){
  'use strict';

  var path = require('path')
    , _ = require('lodash')
    , pkg = require(path.resolve(__dirname, '../../../', 'package.json'))

    , healthObj = require('../../objects/health').object
    , sendResponse = function(res, status, resp) {
      var fullResponse = _.merge(resp, {
        frontend: {
          status: 'UP',
          hello: 'world',
          name: pkg.name,
          version: pkg.version,
        },
      });

      return res.status(status).json(fullResponse);
    };

  module.exports.health = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          return sendResponse(res, response.statusCode, JSON.parse(response.body));
        }
        , errorCB = function(err) {
          var parsedJson;

          try {
            parsedJson = JSON.parse(err.error);
          } catch (e) {
            parsedJson = err.error;
          }
          return sendResponse(res, 500, _.merge({status: 'DOWN'}, parsedJson));
        };


      healthObj.get(req)
        .then(successCB)
        .catch(errorCB);
    };
  };

})();
