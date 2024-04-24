/* eslint-disable strict */

const axios = require('axios');
const config = require('../config/environment')();

const client = axios.create({
  baseURL: config.apiEndpoint,
  timeout: 5000,
  headers: {
    'Content-type': 'application/vnd.api+json',
    Accept: 'application/json',
  },
});

client.interceptors.request.use(function(request) {
  const { Logger } = require('../components/logger');
  const logBody = request.data ? { body: { ...request.data } } : {};

  if (logBody && logBody.body && logBody.body.password) {
    delete logBody.body.password;
  }

  Logger.instance.debug('Sending DAO request to API: ', {
    baseUrl: request.baseURL,
    url: request.url,
    headers: request.headers,
    method: request.method,
    ...logBody,
  });

  return request;
});

client.interceptors.response.use(
  (response) => {
    const data = isResponseDataPlain(response.data) ? { data: response.data } : response.data;

    return { ...data, _headers: response.headers };
  },
  (err) => {
    const error = {
      statusCode: err.response.status,
      error: {
        message: err.response.data.message,
        trace: err.response.data.trace,
      },
    };

    return Promise.reject(error);
  },
);

function isResponseDataPlain(data) {
  return typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean';
}

module.exports.axiosClient = function(method, url, jwtToken, variables) {
  if (variables && variables.body) {
    return client[method](url, variables.body, {
      headers: {
        Authorization: jwtToken,
        ...variables.headers,
      },
    });
  }

  return client[method](url, {
    headers: {
      Authorization: jwtToken,
      ...(variables && variables.headers),
    },
  });
};
