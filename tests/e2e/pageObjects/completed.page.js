const ListPage = require('./list.page');

class CompletedPage extends ListPage {
  constructor() {
    super('/completed', 'Inbox (Completed) - Juror Digital', 'Completed');
  }
}

module.exports = CompletedPage;
