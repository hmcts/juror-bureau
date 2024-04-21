/* eslint-disable strict */

const controller = require('./authentication.controller');

module.exports = function(app) {

  app.get('/auth/azure',
    'authentication.azure.get',
    controller.getAzureAuth(app));

  app.get('/auth/callback',
    'authentication.azure.callback',
    controller.getAzureCallback(app));

};
