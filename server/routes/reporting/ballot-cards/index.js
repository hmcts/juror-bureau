const { printPoolBallotCards } = require('./ballot-cards.controller');
const auth = require('../../../components/auth');
const { trialOrPool } = require('../../../components/route-parameter-constraints');

module.exports = (app) => {
  app.get('/reporting/ballot-cards/:ballotType/:filter',
    'reports.ballot-cards.report.print',
    trialOrPool,
    auth.verify,
    printPoolBallotCards(app));
};
