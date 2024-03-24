;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.reallocateDAO = new DAO('bureau/responses/reassign', {
    post: function(staffToDeactivate, assignPending, assignTodo, assignUrgents) {
      const body = {
        staffToDeactivate: staffToDeactivate,
        pendingLogin: assignPending,
        todoLogin: assignTodo,
        urgentsLogin: assignUrgents,
      };

      return { body };
    }}
  );
})();
