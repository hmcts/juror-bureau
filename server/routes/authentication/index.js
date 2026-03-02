/* eslint-disable strict */

const controller = require('./authentication.controller');
const azureController = require('./azure.controller');
const errors = require('../../components/errors');

const systemAdminAuth = (req, res, next) => {
  if (
    req.session.hasOwnProperty('authentication') === true &&
    req.session.authentication.hasOwnProperty('activeUserType') === true &&
    (req.session.authentication.activeUserType === 'ADMINISTRATOR' 
      || (req.session.authentication.userType === 'ADMINISTRATOR' && req.session.authentication.activeUserType === 'COURT')
    )
  ) {
    if (typeof next !== 'undefined') {
      return next();
    }

    return true;
  }

  if (typeof next !== 'undefined') {
    return errors(req, res, 403);
  }

  return false;
}

module.exports = function(app) {

  app.get('/auth/internal/azure',
    'authentication.azure.get',
    azureController.getAzureAuth(app));

  app.get('/auth/internal/callback',
    'authentication.azure.callback',
    azureController.getAzureCallback(app));

  app.get('/auth/internal/logout',
    'authentication.logout.get',
    azureController.getAzureLogout(app));

  app.get('/auth/courts-list',
    'authentication.courts-list.get',
    controller.getCourtsList(app),
  );

  app.post('/auth/courts-list',
    'authentication.courts-list.post',
    controller.postCourtsList(app),
  );

  // this would be used to auth as an admin from the admin page
  app.get('/auth/court/:locCode',
    'authentication.select-court.get',
    systemAdminAuth,
    controller.getSelectCourt(app),
  );

  // dev email auth
  app.post('/auth/dev/email',
    'authentication.email.dev',
    isDevelopment,
    controller.postDevEmailAuth(app),
  );

  // allow dev auth only in development
  function isDevelopment(_, res, next) {
    const isDev = process.env.NODE_ENV === 'development';
    const skipSSO = !!process.env.SKIP_SSO || false;

    if (isDev || skipSSO) return next();

    return res.status(401).send();
  }

};
