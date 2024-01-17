Feature: Completed list
  As a Bureau Officer, I want to see a list of every completed response received by the Bureau

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "completed" data
      And I generate responses
      And I add a Super Urgent response with the status "CLOSED" and assignee "samanthak"
      And I add an Urgent response with the status "CLOSED" and assignee "samanthak"
      And I add a SLA Overdue response with the status "CLOSED" and assignee "samanthak"

    # Ensure page cannot be accessed prior to login
    When I navigate to the Completed page
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    When I click the sidenav Completed today link
      Then I confirm I am on the Completed page


    # Start Scenarios
    # -------------------------------------
    Scenario: The correct counts are shown for the Completed today page
      Then the sidenav Completed today count should be "8"
      And the table caption Completed count should be "8"

    Scenario Outline: The correct values appear in the table for response <jurorNumber>
      Then the entry for juror number "<jurorNumber>" contains the name "<name>", the court "<court>" and a valid date and time received
      Examples:
      | jurorNumber | name            | court     |
      | 123123123   | Mr Super Urgent | PLYMOUTH  |
      | 321321321   | Mr Urgent Only  | PLYMOUTH  |
      | 654987321   | Mr Sla Overdue  | PLYMOUTH  |

    @JDB-2142 @bug
    Scenario: The responses are displayed from youngest to oldest

      Then the response at position "1" has Juror Number "309092530"
        And the response at position "2" has Juror Number "209092530"
        And the response at position "3" has Juror Number "301082530"
        And the response at position "4" has Juror Number "387654320"
        And the response at position "5" has Juror Number "387654321"
        And the response at position "6" has Juror Number "123123123"
        And the response at position "7" has Juror Number "321321321"
        And the response at position "8" has Juror Number "654987321"
