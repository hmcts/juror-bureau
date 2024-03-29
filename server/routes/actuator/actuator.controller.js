const path = require('path');
const _ = require('lodash');
const pkg = require(path.resolve(__dirname, '../../../', 'package.json'));
const healthObj = require('../../objects/health').object;

const sendResponse = function (res, status, resp) {
  const fullResponse = _.merge(resp, {
    frontend: {
      status: 'UP',
      hello: 'world',
      name: pkg.name,
      version: pkg.version,
    },
  });

  return res.status(status).json(fullResponse);
};

module.exports.health = function (app) {
  return function (req, res) {
    const successCB = function (response) {
      return sendResponse(res, response.statusCode, JSON.parse(response.body));
    };
    const errorCB = function (err) {
      let parsedJson;

      try {
        parsedJson = JSON.parse(err.error);
      } catch (e) {
        parsedJson = err.error;
      }
      return sendResponse(res, 500, _.merge({ status: 'DOWN' }, parsedJson));
    };


    healthObj.get(require('request-promise'), app)
      .then(successCB)
      .catch(errorCB);
  };
};
