(function() {
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils');
  const { replaceAllObjKeys, mapSnakeToCamel, mapCamelToSnake } = require('../lib/mod-utils');


  module.exports.messageTemplateDAO = new DAO('moj/messages/view', {
    get: function(messageType, locCode) {
      return { 
        uri: urljoin(this.resource, messageType, locCode),
        transform: basicDataTransform2
      };
    }
  });

  module.exports.populatedMessageDAO = new DAO('moj/messages/view/{messageType}/{locCode}/populated', {
    post: function(messageType, locCode, body) {
      return {
        uri: this.resource.replace('{messageType}', messageType).replace('{locCode}', locCode),
        body: mapCamelToSnake(body),
        transform: basicDataTransform2
      };
    }
  });

  module.exports.jurorSearchDAO = new DAO('moj/messages/search', {
    post: function(locCode, _body, simpleResponse) {
      let _locCode = locCode;

      if (_body.court_name) {
        _locCode = _body.court_name.match(/\d+/g)[0];
      }

      let uri = urljoin(this.resource, _locCode);

      if (simpleResponse) {
        uri = urljoin(uri, '?simple_response=true');
      }

      return { 
        uri,
        body: _.mapKeys(_body, (__, key) => _.snakeCase(key)),
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
      return {
        uri: urljoin(this.resource, locCode),
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        transform: (data) => { delete data._headers; return data.data; }
      };
    }
  });

})();
