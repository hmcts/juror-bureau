(() => {
  'use strict';

  const { axiosClient } = require('./axios-instance');

  // type Method = 'delete' | 'get' | 'patch' | 'post' | 'put';
  // type AxiosClientArgs = {
  //   uri?: string,
  //   body?: any,
  //   headers?: {[key:string]: string},
  //   transform?: (any) => any;
  //   debug?: Promise;  // If provided, this promise is always returned instead of calling the API
  // }
  // type ICustomFunctions = Partial<{[key in Method]: (...args) => AxiosClientArgs;}>
  module.exports.DAO = class {
    constructor(resource, customFunctions) {
      this.resource = resource;

      if (customFunctions) {
        Object.keys(customFunctions).forEach(function(key) {
          if (this[key]) {
            const prev = this[key].bind(this);

            this[key] = function(req, ...args) {
              const customData = customFunctions[key].bind(this)(...args);

              if (customData.debug) {
                return customData.debug;
              }

              return prev(req, customData.body, customData.uri || this.resource, customData.headers, customData.baseUrl)
                .then(response => (customData.transform || ((data) => data))(response));
            }.bind(this);
          }
        }.bind(this));
      }
    };

    delete(req, body, uri, headers, ...args) {
      return axiosClient('delete', uri || this.resource, req.session.authToken, { body, headers }, baseUrl);
    };

    get(req, body, uri, headers, baseUrl, ...args) {
      console.log(baseUrl);
      return axiosClient('get', uri || this.resource, req.session.authToken, { headers }, baseUrl);
    };

    patch(req, body, uri, headers, ...args) {
      return axiosClient('patch', uri || this.resource, req.session.authToken, { body, headers }, baseUrl);
    };

    post(req, body, uri, headers, ...args) {
      return axiosClient('post', uri || this.resource, req.session.authToken, { body, headers }, baseUrl);
    };

    put(req, body, uri, headers, ...args) {
      return axiosClient('put', uri || this.resource, req.session.authToken, { body, headers }, baseUrl);
    };
  };
})();
