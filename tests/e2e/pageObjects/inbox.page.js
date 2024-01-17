const ListPage = require('./list.page');

class InboxPage extends ListPage {
  constructor() {
    super('/inbox', 'Inbox (Todo) - Juror Digital', 'Inbox');
  }
}

module.exports = InboxPage;
