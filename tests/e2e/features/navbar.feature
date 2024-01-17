Feature: Navigation bar

  Tests related to the horizontal navbar that appears on all pages

  @JDB-1940
  Scenario: Only the Sign In tab should show when not authenticated
    When I navigate to the login page
    Then the Sign in navigation tab is visible
      And the Sign in navigation tab is active
      And the Sign in navigation tab has the text "Sign in"
      And there is only a single navigation tab

  @JDB-1940
  Scenario: When authenticated, the Sign In tab should not show
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page
      And the Sign in navigation tab is not visible

  @JDB-1940
  Scenario: When authenticated, the Inbox tab should show
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page
      And the Inbox navigation tab is visible
      And the Inbox navigation tab has the text "Inbox"

  @JDB-1940
  Scenario: When authenticated, the Search tab should show
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page
      And the Search navigation tab is visible
      And the Search navigation tab has the text "Search"

  @JDB-1940
  Scenario: When authenticated as a standard user, the Backlog tab should not show
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page
      And the Backlog navigation tab is not visible

  @JDB-1940
  Scenario: When authenticated as a standard user, the Staff tab should not show
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page
      And the Staff navigation tab is not visible

  @JDB-1940
  Scenario: When authenticated as a team leader, the Backlog tab should show
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "jcambell" and "password"

    Then I confirm I am on the Inbox page
      And the Backlog navigation tab is visible
      And the Backlog navigation tab has the text "New Replies"

  @JDB-1940
  Scenario: When authenticated as a team leader, the Staff tab should show
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "jcambell" and "password"

    Then I confirm I am on the Inbox page
      And the Staff navigation tab is visible
      And the Staff navigation tab has the text "Staff"

  @JDB-1940
  Scenario: When authenticatecd, the Inbox tab should show the number of pending responses as "1"
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add a Super Urgent response with the status "TODO" and assignee "samanthak"

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page
      And the Inbox navigation tab shows "1" To do response

  @JDB-2147
  Scenario: When authenticatecd, the Inbox tab should show the number of pending responses as "1" on ALL tabs/pages
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add a Super Urgent response with the status "TODO" and assignee "samanthak"

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page
      And the Inbox navigation tab shows "1" To do response
    Then I navigate to the Search page
      And the Inbox navigation tab shows "1" To do response
    Then I navigate to the Pending page
      And the Inbox navigation tab shows "1" To do response
    Then I navigate to the Completed page
      And the Inbox navigation tab shows "1" To do response

  @JDB-1940
  Scenario Outline: When I click the "<navTab>" button on the "<currentPage>" page then I am taken to the "<nextPage>" page while authenticated as "<user>"
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "<user>" and "password"

    Then I confirm I am on the Inbox page
    When I go directly to the "<currentPage>" page
      Then I confirm I am on the "<currentPage>" page

    When I click the <navTab> navigation tab
      Then I confirm I am on the "<nextPage>" page

    Examples:
    | user      | currentPage | nextPage  | navTab  |
    | samanthak | Inbox       | Inbox     | Inbox   |
    | samanthak | Inbox       | Search    | Search  |

    | samanthak | Search      | Search    | Search  |
    | samanthak | Search      | Inbox     | Inbox   |

    | jcambell  | Inbox       | Inbox     | Inbox   |
    | jcambell  | Inbox       | Search    | Search  |
    | jcambell  | Inbox       | New-Replies   | Backlog |
    | jcambell  | Inbox       | Staff     | Staff   |

    | jcambell  | Search      | Search    | Search  |
    | jcambell  | Search      | Inbox     | Inbox   |
    | jcambell  | Search      | New-Replies   | Backlog |
    | jcambell  | Search      | Staff     | Staff   |

    | jcambell  | New-Replies     | New-Replies   | Backlog |
    | jcambell  | New-Replies     | Inbox     | Inbox   |
    | jcambell  | New-Replies     | Search    | Search  |
    | jcambell  | New-Replies     | Staff     | Staff   |

    | jcambell  | Staff       | Staff     | Staff   |
    | jcambell  | Staff       | Inbox     | Inbox   |
    | jcambell  | Staff       | Search    | Search  |
    | jcambell  | Staff       | New-Replies   | Backlog |

  @JDB-1940
  Scenario: When authenticated as a standard user, the Backlog page is inaccessible
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page

    When I navigate to the New Replies page
    Then I confirm I am on the Inbox page

  @JDB-1940
  Scenario: When authenticated as a standard user, the Staff page is inaccessible
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "samanthak" and "password"

    Then I confirm I am on the Inbox page

    When I navigate to the Staff page
    Then I confirm I am on the Inbox page

  @JDB-1940
  Scenario Outline: When on the <page> page, the <page> tab is active and all other tabs are inactive
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      And I login with "jcambell" and "password"
      Then I confirm I am on the Inbox page

    When I go directly to the "<page>" page
      And the Inbox navigation tab is "<inboxState>"
      And the Backlog navigation tab is "<backlogState>"
      And the Search navigation tab is "<searchState>"
      And the Staff navigation tab is "<staffState>"

    Examples:
    | page        | inboxState  | backlogState  | searchState | staffState  |
    | Inbox       | active      | inactive      | inactive    | inactive    |
    | New-Replies | inactive    | active        | inactive    | inactive    |
    | Search      | inactive    | inactive      | active      | inactive    |
    | Staff       | inactive    | inactive      | inactive    | active      |
