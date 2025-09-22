/* eslint-disable strict */
const secretsConfig = require('config');
const config = require('../../config/environment')();
const axios = require('axios');
const { makeManualError } = require('../../lib/mod-utils');

module.exports.getAzureAuth = function(app) {
  return function(_, res) {
    app.logger.debug('Redirecting to Azure for authentication');

    const { authUrl, queryParams } = buildAzureUrl('authorize');

    return res.redirect(`${authUrl}?${queryParams.toString()}`);
  };
};

module.exports.getAzureCallback = function(app) {
  return async function(req, res) {
    const graphUrl = config.auth.graphUrl;

    const { code } = req.query;
    const { authUrl, queryParams } = buildAzureUrl('token', code);
    const payload = {};

    queryParams.forEach((value, key) => {
      payload[key] = value;
    });

    let authResponse;
    let response;

    try {
      authResponse = await axios.post(authUrl, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (err) {
      app.logger.crit('Error getting token from Azure', {
        error: err,
      });

      return res.redirect(app.namedRoutes.build('login.get'));
    }

    try {
      response = await axios.get(graphUrl, {
        headers: {
          Authorization: 'Bearer ' + authResponse.data.access_token,
        },
      });
    } catch (err) {
      app.logger.crit('Error getting user data from Azure', {
        error: err,
      });

      return res.redirect(app.namedRoutes.build('login.get'));
    }

    if (!response.data.mail || response.data.mail === '') {
      app.logger.crit('No email found in user data', {
        data: {
          displayName: response.data.displayName,
        },
      });

      req.session.errors = makeManualError('login', 'Email address not found');

      return res.redirect(app.namedRoutes.build('login.get'));
    }

    app.logger.info('User authenticated', {
      email: response.data.mail.toLowerCase(),
    });

    req.session.email = response.data.mail.toLowerCase();

    return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
  };
};

module.exports.getAzureLogout = function(app) {
  return function(req, res) {
    const tenantId = secretsConfig.get('secrets.juror.azure-tenant-id');

    const authUrl = config.auth.authUrl(tenantId);
    const logoutRedirect = config.auth.logoutRedirect;

    app.logger.debug('Redirecting to Azure for logout', {
      auth: req.session.authentication,
    });

    req.session.destroy((err) => {
      if (err) {
        app.logger.crit('Error destroying session', err);

        return res.redirect('login.get');
      }

      return res.redirect(`${authUrl}/logout?post_logout_redirect_uri=${logoutRedirect}`);
    });
  };
};

function buildAzureUrl(/** @type {'authorize' | 'token'} */pathPart, code) {
  const clientId = secretsConfig.get('secrets.juror.azure-app-id');
  const tenantId = secretsConfig.get('secrets.juror.azure-tenant-id');

  const authUrl = config.auth.authUrl(tenantId);
  const cbUrl = config.auth.callbackUrl;
  const claims = config.auth.claims;

  const queryParams = new URLSearchParams();

  queryParams.append('client_id', clientId);
  queryParams.append('scope', claims);
  queryParams.append('response_type', 'code');
  queryParams.append('redirect_uri', cbUrl);

  if (pathPart === 'authorize') {
    queryParams.append('prompt', 'select_account');
  }

  if (pathPart === 'token' && code) {
    const clientSecret = secretsConfig.get('secrets.juror.azure-client-secret');

    queryParams.append('client_secret', clientSecret);
    queryParams.append('code', code);
    queryParams.append('grant_type', 'authorization_code');
  }

  return { authUrl: `${authUrl}/${pathPart}`, queryParams };
}
