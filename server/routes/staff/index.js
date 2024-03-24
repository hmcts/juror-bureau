;(function(){
  'use strict';

  const controller = require('./staff.controller');
  const auth = require('../../components/auth');
  const { todoDAO } = require('../../objects');

  module.exports = function(app) {
    // Staff list
    app.get(
      '/staff',
      'staff.get',
      auth.verify,
      auth.isSupervisor,
      todoDAO.get,
      controller.index(app));

    // Staff filter POST
    app.post(
      '/staff',
      'staff.filter.post',
      auth.verify,
      auth.isSupervisor,
      controller.staffFilterPost(app));

    // Staff Create GET
    app.get(
      '/staff/create',
      'staff.create.get',
      auth.verify,
      auth.isSupervisor,
      todoDAO.get,
      controller.staffCreate(app));

    // Staff Create POST
    app.post(
      '/staff/create',
      'staff.create.post',
      auth.verify,
      auth.isSupervisor,
      controller.staffCreatePost(app));

    // Assignment
    app.get(
      '/staff/assign/:id',
      'response.assign.get',
      auth.verify,
      controller.getAssign(app));

    app.post(
      '/staff/assign',
      'response.assign.post',
      auth.verify,
      controller.postAssign(app));

    app.get(
      '/staff/assign-multi/selected',
      'response.assign.multi.selected.get',
      auth.verify,
      controller.getAssignMulti(app));

    app.post(
      '/staff/assign-multi/selected',
      'response.assign.multi.selected.post',
      auth.verify,
      controller.getAssignMulti(app));

    app.post(
      '/staff/assign-multi',
      'response.assign.multi.post',
      auth.verify,
      controller.postAssignMulti(app));


    // Staff Edit
    app.get(
      '/staff/:login',
      'staff.edit.get',
      auth.verify,
      auth.isSupervisor,
      todoDAO.get,
      controller.staffEdit(app));

    // Staff Edit POST
    app.post(
      '/staff/:login',
      'staff.edit.post',
      auth.verify,
      auth.isSupervisor,
      controller.staffEditPost(app));

    // reallocation POST
    app.post(
      '/responses/reassign',
      'response.reassign.post',
      auth.verify,
      auth.isSupervisor,
      controller.postReallocation(app));

    // reallocation GET
    app.get(
      '/staff/reallocate/:login',
      'staff.reallocate.get',
      auth.verify,
      controller.getReallocate(app));

  };

})();
