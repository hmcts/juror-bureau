const { printPoolBallotCards } = require('./ballot-cards.controller');
const auth = require('../../../components/auth');

module.exports = (app) => {
  app.get('/reporting/ballot-cards/:ballotType(trial|pool)/:filter',
    'reports.ballot-cards.report.print',
    auth.verify,
    printPoolBallotCards(app));
};
