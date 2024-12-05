/* eslint-disable strict */

const axios = require('axios');
const config = require('../config/environment')();

const client = axios.create({
  baseURL: config.apiEndpoint,
  timeout: 30000,
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

  if (request.customBaseUrl) {
    request.baseURL = request.customBaseUrl;
    delete request.customBaseUrl;
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
      statusCode: err.response?.status || 500,
      error: {
        message: err.response?.data.message,
        code: err.response?.data.code || err.code,
        trace: err.response?.data.trace,
      },
    };
    
    if (err.response?.data.reasonCode) {
      error.error.reasonCode = err.response.data.reasonCode
    }

    return Promise.reject(error);
  },
);

function isResponseDataPlain(data) {
  return typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean';
}

module.exports.axiosClient = function(method, url, jwtToken, variables, customBaseUrl) {
  if (variables && variables.body) {
    if (method === 'delete') {
      return client[method](url, {
        data: variables.body,
        headers: {
          Authorization: jwtToken,
          ...variables.headers,
        },
        customBaseUrl
      });
    }
    return client[method](url, variables.body, {
      headers: {
        Authorization: jwtToken,
        ...variables.headers,
      },
      customBaseUrl
    });
  }

  // PATCH requests with no body need diferent handling
  if ((method === 'patch' || method === 'put') && !variables?.body) {
    return client[method](url, {}, {
      headers: {
        Authorization: jwtToken,
        ...(variables && variables.headers),
      },
      customBaseUrl
    });
  }

  return client[method](url, {
    headers: {
      Authorization: jwtToken,
      ...(variables && variables.headers),
    },
    customBaseUrl
  });
};
