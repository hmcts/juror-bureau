Feature: Pending list
  As a Bureau Officer, I want to see a list of every pending response received by the Bureau

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I generate responses
      And I add a Super Urgent response with the status "AWAITING_CONTACT" and assignee "samanthak"
      And I add an Urgent response with the status "AWAITING_TRANSLATION" and assignee "samanthak"
      And I add a SLA Overdue response with the status "AWAITING_COURT_REPLY" and assignee "samanthak"

    # Ensure page cannot be accessed prior to login
    When I navigate to the Pending page
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    When I click the sidenav Replies pending link
      Then I confirm I am on the Pending page


    # Start Scenarios
    # -------------------------------------
    Scenario: The correct counts are shown for the Replies pending page
      Then the sidenav Replies pending count should be "6"
      And the table caption Replies pending count should be "6"

    Scenario Outline: The correct values appear in the table for response <jurorNumber>
      Then the entry for juror number "<jurorNumber>" contains the name "<name>", the court "<court>", the status "<status>" and a valid date received
      Examples:
      | jurorNumber | name            | court     | status                |
      | 123123123   | Mr Super Urgent | PLYMOUTH  | Awaiting juror        |
      | 321321321   | Mr Urgent Only  | PLYMOUTH  | Awaiting translation  |
      | 654987321   | Mr Sla Overdue  | PLYMOUTH  | Awaiting court reply  |

    Scenario: The super urgent symbol is shown correctly
      Then the entry for juror number "123123123" contains the super urgent symbol

    Scenario: The urgent symbol is shown correctly
      Then the entry for juror number "321321321" contains the urgent symbol

    Scenario: The SLA overdue symbol is shown correctly
      Then the entry for juror number "654987321" contains the sla symbol

    Scenario: The responses are displayed from oldest to youngest within each urgency category
      Then the response at position "1" has Juror Number "123123123"
      And the response at position "2" has Juror Number "321321321"
      And the response at position "3" has Juror Number "654987321"
      And the response at position "4" has Juror Number "287654322"
      And the response at position "5" has Juror Number "287654321"
      And the response at position "6" has Juror Number "287654320"
