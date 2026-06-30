(function() {
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');
  const { replaceAllObjKeys, mapSnakeToCamel, mapCamelToSnake } = require('../lib/mod-utils');


  module.exports.messageTemplateDAO = new DAO('moj/messages/view', {
    get: function(messageType, locCode) {
      return { 
        uri: urljoin(this.resource, messageType, locCode),
        transform: basicDataTransform
      };
    }
  });

  module.exports.populatedMessageDAO = new DAO('moj/messages/view/{messageType}/{locCode}/populated', {
    post: function(messageType, locCode, body) {
      return {
        uri: this.resource.replace('{messageType}', messageType).replace('{locCode}', locCode),
        body,
        transform: basicDataTransform
      };
    }
  });

  module.exports.jurorSearchDAO = new DAO('moj/messages/search', {
    post: function(locCode, _body, simpleResponse) {
      let _locCode = locCode;
      const body = _.cloneDeep(_body);

      if (body.court_name) {
        _locCode = body.court_name.match(/\d+/g)[0];
      }

      let uri = urljoin(this.resource, _locCode);

      if (simpleResponse) {
        uri = urljoin(uri, '?simple_response=true');
      }

      return { 
        uri,
        body: _.mapKeys(body, (value, key) => _.snakeCase(key)),
        transform: mapSnakeToCamel
      };
    }
  });

  module.exports.sendMessage = new DAO('moj/messages/send', {
    post: function(messageType, locCode, body) {
      return { 
        uri: urljoin(this.resource, messageType, locCode),
        body: _.mapKeys(body, (__, key) => _.snakeCase(key))
      };
    }
  });

  module.exports.downloadCSVDAO = new DAO('moj/messages/csv', {
    post: function(locCode, body) {
      const payload = _.cloneDeep(body);

      return {
        uri: urljoin(this.resource, locCode),
        body: payload,
        headers: {
          'Content-Type': 'application/json',
        },
        transform: (data) => { delete data._headers; return data.data; }
      };
    }
  });

  module.exports.sendBureauMessage = new DAO('moj/messages/bureau/send', {
    post: function(body) {
      return {
        uri: this.resource,
        body: mapCamelToSnake(body),
        transform: (data) => basicDataTransform2(data),
      };
    }
  });

})();
