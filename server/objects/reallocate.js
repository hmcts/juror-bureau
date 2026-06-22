;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils')

  module.exports.object = new DAO('bureau/responses/reassign', {
    post: function(staffToDeactivate, assignPending, assignTodo, assignUrgents) {
      return {
        uri: this.resource,
        body: {
          staffToDeactivate: staffToDeactivate,
          pendingLogin: assignPending,
          todoLogin: assignTodo,
          urgentsLogin: assignUrgents,
        },
        transform: basicDataTransform
      }
    }
  });

})();
