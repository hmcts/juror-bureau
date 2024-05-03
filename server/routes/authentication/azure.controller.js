/* eslint-disable strict */
const secretsConfig = require('config');
const axios = require('axios');

module.exports.getAzureAuth = function(app) {
  return function(_, res) {
    app.logger.debug('Redirecting to Azure for authentication');

    const { authUrl, queryParams } = buildAzureUrl('authorize');

    return res.redirect(`${authUrl}?${queryParams.toString()}`);
  };
};

module.exports.getAzureCallback = function(app) {
  return async function(req, res) {
    const graphUrl = secretsConfig.get('secrets.azure.graph-url');

    const { code } = req.query;
    const { authUrl, queryParams } = buildAzureUrl('token', code);
    const payload = {};

    queryParams.forEach((value, key) => {
      payload[key] = value;
    });

    const authResponse = await axios.post(authUrl, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const response = await axios.get(graphUrl, {
      headers: {
        Authorization: 'Bearer ' + authResponse.data.access_token,
      },
    });

    req.session.email = response.data.mail.toLowerCase();

    return res.redirect(app.namedRoutes.build('authentication.courts-list.get'));
  };
};

module.exports.getAzureLogout = function(app) {
  return function(req, res) {
    const tenantId = secretsConfig.get('secrets.azure.tenant-id');
    const authUrl = secretsConfig.get('secrets.azure.auth-url').replace('{tenant_id}', tenantId);
    const logoutRedirect = secretsConfig.get('secrets.azure.logout-redirect');

    app.logger.debug('Redirecting to Azure for logout', {
      auth: req.session.authentication,
    });

    req.session.destroy((err) => {
      if (err) {
        app.logger.error('Error destroying session', err);

        return res.redirect('login.get');
      }

      return res.redirect(`${authUrl}/logout?post_logout_redirect_uri=${logoutRedirect}`);
    });
  };
};

function buildAzureUrl(/** @type {'authorize' | 'token'} */pathPart, code) {
  const clientId = secretsConfig.get('secrets.azure.app-id');
  const tenantId = secretsConfig.get('secrets.azure.tenant-id');
  const authUrl = secretsConfig.get('secrets.azure.auth-url').replace('{tenant_id}', tenantId);
  const claims = secretsConfig.get('secrets.azure.claims');
  const cbUrl = secretsConfig.get('secrets.azure.callback-url');

  const queryParams = new URLSearchParams();

  queryParams.append('client_id', clientId);
  queryParams.append('scope', claims);
  queryParams.append('response_type', 'code');
  queryParams.append('redirect_uri', cbUrl);

  if (pathPart === 'authorize') {
    queryParams.append('prompt', 'select_account');
  }

  if (pathPart === 'token' && code) {
    const clientSecret = secretsConfig.get('secrets.azure.client-secret');

    queryParams.append('client_secret', clientSecret);
    queryParams.append('code', code);
    queryParams.append('grant_type', 'authorization_code');
  }

  return { authUrl: `${authUrl}/${pathPart}`, queryParams };
}
