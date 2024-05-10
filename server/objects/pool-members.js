/* eslint-disable strict */
const { DAO } = require('./dataAccessObject');
const { constants, mapSnakeToCamel, mapCamelToSnake } = require('../lib/mod-utils');
const urljoin = require('url-join');

module.exports.poolMembersDAO = new DAO('moj/pool-create/members', {
  get: function(poolNumber) {
    const uri = urljoin(this.resource, poolNumber);

    return {
      uri,
      transform: mapSnakeToCamel,
    };
  },
  post: function(body) {
    body['page_number'] = body['page_number'] || 1;
    body['page_limit'] = constants.PAGE_SIZE;
    body['sort_method'] = body['sort_method'] === 'ascending' ? 'ASC' : 'DESC';
    body['sort_field'] = mapCamelToSnake(body['sort_field'])?.toUpperCase();

    return {
      body,
      transform: mapSnakeToCamel,
    };
  },
});
