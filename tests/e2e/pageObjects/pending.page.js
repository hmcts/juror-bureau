const ListPage = require('./list.page');

class PendingPage extends ListPage {
  constructor() {
    super('/pending', 'Inbox (Pending) - Juror Digital', 'Pending');
  }
}

module.exports = PendingPage;
