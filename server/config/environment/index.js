/* eslint-disable strict */
const path = require('path');
const _ = require('lodash');
const winston = require('winston');
const fs = require('fs');
const environmentFileName = (process.env.NODE_ENV || 'development');

let merged = {};

const all = {
  env: (process.env.NODE_ENV || 'development'),

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 3000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Remote Url for Backend API
  apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:8080/api/v1',

  // Remote Url for SmartSurvey API
  smartSurveyAPIEndpoint: process.env.SMARTSURVEY_API_ENDPOINT || 'https://api.smartsurvey.io/v1/surveys/',
  smartSurveyIdV1: process.env.SMARTSURVEY_ID_V1 || '301219',
  smartSurveyIdV2: process.env.SMARTSURVEY_ID_V2 || '652997',
  smartSurveyExportV1: process.env.SMARTSURVEY_EXPORT_V1 || 'Dashboard Export',
  smartSurveyExportV2: process.env.SMARTSURVEY_EXPORT_V2 || 'Dashboard Export',

  // Authentication, must be string
  // If true will use http Basic Auth to protect the Alpha/Beta
  useAuth: 'false',

  // SSL, must be string
  // If true then any non https requests will be redirected to the https equivalent
  useHttps: 'false',

  // Google analytics tracking code
  trackingCode: process.env.TRACKING_CODE || '',

  // If true, logs will be output in terminal as well as saved to file
  logConsole: 'debug',

  // auth config
  auth: {
    authUrl: (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`,
    claims: 'User.Read',
    graphUrl: 'https://graph.microsoft.com/v1.0/me',
    callbackUrl: process.env.CALLBACK_URL || 'http://localhost:3000/auth/internal/callback',
    logoutRedirect: process.env.LOGOUT_REDIRECT || 'http://localhost:3000',
  },
  
  //rate limiting - defaults to 1 mil requests per minute
  rateLimit: {
    time: process.env.RATE_LIMIT_TIME || (1 * 60 * 1000), // time window in milliseconds
    max: process.env.RATE_LIMIT_MAX || 1000000, // max number of requests per time (in ms above)
    message: 'Too many requests, please try again later. Thank you.',
  },
};

module.exports = function() {
  // Export the config object based on the NODE_ENV
  // ==============================================
  merged = _.merge(
    all,
    require('./shared'));


  // Try to access configuration file for current NODE_ENV
  try {
    fs.accessSync(__dirname + '/' + environmentFileName + '.js', fs.F_OK);
    merged = _.merge(merged, require('./' + environmentFileName + '.js'));
  } catch (e) {
    // It isn't accessible
    winston.error(e);
  }

  return merged;
};