(function() {
  'use strict';

  const _ = require('lodash')
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.erLocalAuthorityStatusDAO = new DAO('moj/er-dashboard/local-authority-status', {
    post: function(body) {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
        body: replaceAllObjKeys(body, _.snakeCase),
      }
    }
  });

  module.exports.erUploadStats = new DAO('moj/er-dashboard/upload-stats', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });

  module.exports.localAuthoritiesDAO = new DAO('moj/er-dashboard/local-authorities', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });

  module.exports.localAuthorityInfoDAO = new DAO('moj/er-dashboard/local-authority-info/{laCode}', {
    get: function(laCode) {
      return {
        uri: this.resource.replace('{laCode}', laCode),
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });

  module.exports.localAuthorityEmailsDAO = new DAO('moj/LaExport/email-addresses', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });
  
  module.exports.deactivateLocalAuthorityDAO = new DAO('moj/er-administration/deactivate-la', {
    put: function(body) {
      return {
        uri: this.resource,
        body: replaceAllObjKeys(body, _.snakeCase),
      }
    }
  });
  
  module.exports.sendReminderDAO = new DAO('moj/notification/send-la-reminder', {
    post: function(body) {
      return {
        uri: this.resource,
        body: replaceAllObjKeys(body, _.snakeCase),
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });

  // module.exports.activateLocalAuthorityDAO = new DAO('moj/er-administration/activate-la', {
  //   put: function(body) {
  //     return {
  //       uri: this.resource,
  //       body: replaceAllObjKeys(body, _.snakeCase),
  //     }
  //   }
  // });

  module.exports.activateLocalAuthorityDAO = {
    put: function(body) {
      return true;
    }
  };

  module.exports.editLocalauthorityNotesDAO = {
    put: function(body) {
      return true;
    }
  };

  module.exports.erDeadlineDAO = new DAO('moj/er-administration/deadline', {
    put: function(body) {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
        body: replaceAllObjKeys(body, _.snakeCase),
      };
    }
  });

})();
