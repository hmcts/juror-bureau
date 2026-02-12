(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { dateFilter, toSentenceCase } = require('../../components/filters');
  const { makeManualError, paginationBuilder } = require('../../lib/mod-utils');
  const {
    erLocalAuthorityStatusDAO,
    localAuthoritiesDAO,
    erUploadStats,
  } = require('../../objects/electoral-register');
  const PAGE_SIZE = 20;

  module.exports.getSetDeadline = (app) => (req, res) => {
    return res.render('electoral-register/set-deadline', {
      pageTitle: 'Set deadline',
      postUrl: '/electoral-register/set-deadline',
      cancelUrl: '/electoral-register'
    });
  };


  module.exports.postSetDeadline = (app) => (req, res) => {
    console.log("Post working for button");
    console.log('Form body:', req.body);
    return res.send('ok - deadline received');
  }

})();
