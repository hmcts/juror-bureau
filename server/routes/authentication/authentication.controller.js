/* eslint-disable strict */

const secretsConfig = require('config');
const axios = require('axios');

module.exports.getAzureAuth = function(app) {
  return function(req, res) {
    const clientId = secretsConfig.get('secrets.juror.azure-app-id');
    const tenantId = secretsConfig.get('secrets.juror.azure-tenant-id');
    const azureAuthUrl = 'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/authorize';

    // return res.redirect(azureAuthUrl + '?client_id=' + clientId + '&scope=openid' + '&response_type=code');
    // return res.redirect(azureAuthUrl + '?client_id=' + clientId + '&scope=openid+email+https://graph.microsoft.com/User.Read' + '&response_type=code');
    return res.redirect(azureAuthUrl + '?client_id=' + clientId + '&scope=User.Read' + '&response_type=code&redirect_uri=http://localhost:3000/auth/internal/callback');
  };
};

module.exports.getAzureCallback = function(app) {
  return async function(req, res) {
    const code = req.query.code;
    const clientId = secretsConfig.get('secrets.juror.azure-app-id');
    const clientSecret = secretsConfig.get('secrets.juror.azure-app-secret');
    const tenantId = secretsConfig.get('secrets.juror.azure-tenant-id');

    const azureTokenUrl = 'https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/token';

    const authResponse = await axios.post(azureTokenUrl, {
      'client_id': clientId,
      scope: 'openid',
      code: code,
      'redirect_uri': 'http://localhost:3000/auth/internal/callback',
      'grant_type': 'authorization_code',
      'client_secret': clientSecret,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    // https://graph.microsoft.com/v1.0/me?$select=displayName,mail,mailboxSettings/userPrincipalName%22
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: 'Bearer ' + authResponse.data.access_token,
      },
    });

    return res.send(response.data);
    // return res.redirect('/auth/azure');
  };
};
