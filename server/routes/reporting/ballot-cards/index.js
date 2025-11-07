const { printPoolBallotCards } = require('./ballot-cards.controller');
const auth = require('../../../components/auth');
const { checkRouteParam } = require('../../../lib/mod-utils');

module.exports = (app) => {
  app.get('/reporting/ballot-cards/:ballotType/:filter',
    'reports.ballot-cards.report.print',
    auth.verify,
    checkRouteParam('ballotType', ['trial', 'pool']),
    printPoolBallotCards(app));
};
