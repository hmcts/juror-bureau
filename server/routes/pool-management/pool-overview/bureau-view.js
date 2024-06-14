/* eslint-disable strict */
const _ = require('lodash');
const paginateJurorsList = require('./paginate-jurors-list');
const modUtils = require('../../../lib/mod-utils');

module.exports = function(app, req, res, pool, membersList, _errors, selectedJurors, selectAll) {
  const { poolNumber } = req.params;
  const { status } = req.query;

  let assignUrl = app.namedRoutes.build('pool-overview.reassign.post', { poolNumber });
  let transferUrl = app.namedRoutes.build('pool-overview.transfer.post', { poolNumber });
  let completeServiceUrl = app.namedRoutes.build('pool-overview.complete-service.post', { poolNumber });
  let postponeUrl = app.namedRoutes.build('pool-overview.postpone.post', { poolNumber });
  let availableSuccessMessage = false;
  let successBanner;
  let tmpError;
  let error = null;
  let isOnlyResponded = false;

  req.session.poolDetails = pool;

  const filters = req.query;

  if (status && status === 'responded') {
    isOnlyResponded = true;
  }

  app.logger.info('Fetched court members: ', {
    auth: req.session.authentication,
    data: membersList,
  });

  if (req.session.bannerMessage) {
    availableSuccessMessage = true;
    successBanner = req.session.bannerMessage;
  }

  if (req.session.errors && !_errors) {
    tmpError = req.session.errors;
  }

  if (_errors && _errors.type === 'pool-delete-error') {
    error = _errors;
  }

  const currentPage = req.query.page || 1;
  const sortBy = req.query.sortBy || 'jurorNumber';
  const order = req.query.sortOrder || 'asc';

  const totalJurors = membersList.totalItems;
  const totalCheckedJurors = selectAll ? membersList.totalItems : selectedJurors.length || 0;

  let jurors = paginateJurorsList(membersList.data, sortBy, order, false, selectedJurors, selectAll);

  // eslint-disable-next-line no-param-reassign
  selectedJurors = selectedJurors.filter(item => !membersList.data.find(juror => juror.jurorNumber === item));

  delete req.session.errors;
  delete req.session.bannerMessage;

  req.session.jurorDetails = {};
  if (membersList && membersList.data) {
    membersList.data.forEach(item => {
      req.session.jurorDetails[item.jurorNumber] = item;
    });
  }

  const pageItems = modUtils.paginationBuilder(
    membersList.totalItems,
    currentPage,
    req.url
  );

  delete req.session.bannerMessage;

  // set the loc code for navigating to juror record
  req.session.locCode = pool.poolDetails.locCode;

  const searchParams = req.url.split('?')[1];
  if (searchParams) {
    postponeUrl += `?${searchParams}`;
    assignUrl += `?${searchParams}`;
    completeServiceUrl += `?${searchParams}`;
    transferUrl += `?${searchParams}`;
  }

  res.render('pool-management/pool-overview/bureau-pool-overview', {
    backLinkUrl:{
      built: true,
      url: app.namedRoutes.build('pool-management.get') + '?status=created',
    },
    membersHeaders: jurors.headers,
    poolMembers: jurors.list,
    pageItems: {
      prev: pageItems.prev,
      next: pageItems.next,
      items: pageItems.items.map(item => ({
        ...item,
        href: item.href,
        attributes: {
          id: `pool-overview-page-${item.number}`,
        },
      })),
    },
    availableSuccessMessage: availableSuccessMessage,
    successBanner: successBanner,
    poolDetails: pool.poolDetails,
    bureauSummoning: pool.bureauSummoning,
    poolSummary: pool.poolSummary,
    additionalStatistics: pool.additionalStatistics,
    isNil: pool.poolDetails.is_nil_pool,
    isActive: pool.isActive,
    currentOwner: pool.poolDetails.current_owner,
    currentTab: 'jurors',
    postUrls: { assignUrl, transferUrl, completeServiceUrl, postponeUrl },
    navData: _.clone(req.session.poolManagementNav),
    errors: {
      title: 'Please check the form',
      count: typeof tmpError !== 'undefined' ? Object.keys(tmpError).length : 0,
      items: tmpError,
    },
    appliedFilters: {
      ...filters,
    },
    error,
    selectedJurors,
    isOnlyResponded,
    totalJurors,
    totalCheckedJurors,
    selectAll,
  });
};
