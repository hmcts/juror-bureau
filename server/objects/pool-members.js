(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { constants } = require('../lib/mod-utils');
  const utils = require('../lib/utils');

  module.exports.poolMembersDAO = new DAO('moj/pool-create/members', {
    get: function(poolNumber) {
      const uri = urljoin(this.resource, '?poolNumber=' + poolNumber);

      return { uri };
    },
    post: function(body) {
      const _body = { ...body };

      _body['page_number'] = body['page_number'] || 1;
      _body['page_limit'] = constants.PAGE_SIZE;
      _body['sort_method'] = body['sort_method'] === 'ascending' ? 'ASC' : 'DESC';
      _body['sort_field'] = utils.camelToSnake(body['sort_field'])?.toUpperCase();

      return { body: _body };
    },
  });
})();
