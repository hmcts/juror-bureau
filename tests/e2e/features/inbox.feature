Feature: Inbox list
  As a Bureau Officer, I want to see a list of every todo response received by the Bureau

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I generate responses
      And I add a generated response with the juror number "122456689" and the status "TODO" for assignee "jcambell"
      And I add a generated response with the juror number "112436689" and the status "AWAITING_CONTACT" for assignee "jcambell"
      And I add a generated response with the juror number "123156649" and the status "AWAITING_CONTACT" for assignee "jcambell"
      And I add a generated response with the juror number "123011234" and the status "CLOSED" for assignee "jcambell"
      And I add a generated response with the juror number "123021234" and the status "CLOSED" for assignee "jcambell"
      And I add a generated response with the juror number "123031234" and the status "CLOSED" for assignee "jcambell"
      And I add a generated response with the juror number "123041234" and the status "CLOSED" for assignee "jcambell"
      And I add a Super Urgent response with the status "TODO" and assignee "samanthak"
      And I add an Urgent response with the status "TODO" and assignee "samanthak"
      And I add a SLA Overdue response with the status "TODO" and assignee "samanthak"

    # Ensure page cannot be accessed prior to login
    When I navigate to the Inbox page
      Then I confirm I am on the Login page

    # Start Scenarios
    # -------------------------------------
    #AC 5
    Scenario: The correct counts are shown for the Todo page for samanthak
      When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page
      And the sidenav Todo count should be "9"
      And the table caption Todo count should be "9"

    Scenario Outline: The correct values appear in the table for response <jurorNumber>
      When I login with "samanthak" and "password"
      And I confirm I am on the Inbox page
      Then the entry for juror number "<jurorNumber>" contains the name "<name>", the court "<court>" and a valid date received
      Examples:
      | jurorNumber | name            | court     |
      | 123123123   | Mr Super Urgent | PLYMOUTH  |
      | 321321321   | Mr Urgent Only  | PLYMOUTH  |
      | 654987321   | Mr Sla Overdue  | PLYMOUTH  |

    Scenario: The super urgent symbol is shown correctly
      When I navigate to the login page
        And I login with "samanthak" and "password"
      Then the entry for juror number "123123123" contains the super urgent symbol

    Scenario: The urgent symbol is shown correctly
      When I navigate to the login page
        And I login with "samanthak" and "password"
      Then the entry for juror number "321321321" contains the urgent symbol

    Scenario: The SLA overdue symbol is shown correctly
      When I navigate to the login page
        And I login with "samanthak" and "password"
      Then the entry for juror number "654987321" contains the sla symbol

    Scenario: The responses are displayed from oldest to youngest within each urgency category
      When I navigate to the login page
        And I login with "samanthak" and "password"

      Then the response at position "1" has Juror Number "123123123"
        And the response at position "2" has Juror Number "321321321"
        And the response at position "3" has Juror Number "654987321"
        And the response at position "4" has Juror Number "187654325"
        And the response at position "5" has Juror Number "187654324"
        And the response at position "6" has Juror Number "187654323"
        And the response at position "7" has Juror Number "187654322"
        And the response at position "8" has Juror Number "187654321"
        And the response at position "9" has Juror Number "187654320"

    #AC 5
    @JDB-1954
    Scenario: The correct counts are shown for the Todo page for jcambell
      When I navigate to the login page
        And I login with "jcambell" and "password"

      Then I confirm I am on the Inbox page
        And the sidenav Todo count should be "1"
        And the table caption Todo count should be "1"

    # AC 6
    @JDB-1954
    Scenario: The correct counts are shown for the Replies Pending page for samanthak
      When I navigate to the login page
        And I login with "samanthak" and "password"
        Then I confirm I am on the Inbox page

      When I navigate to the Pending page

      Then the sidenav Replies pending count should be "3"
        And the table caption Replies pending count should be "3"

    # AC 6
    @JDB-1954
    Scenario: The correct counts are shown for the Replies Pending page for jcambell
      When I navigate to the login page
        And I login with "jcambell" and "password"
        Then I confirm I am on the Inbox page

      When I navigate to the Pending page

      Then the sidenav Replies pending count should be "2"
        And the table caption Replies pending count should be "2"

    # AC 7
    @JDB-1954
    Scenario: The correct counts are shown for the Completed today page for samanthak
      When I navigate to the login page
        And I login with "samanthak" and "password"
        Then I confirm I am on the Inbox page

      When I navigate to the Completed page

      Then the sidenav Completed today count should be "2"
        And the table caption Completed count should be "2"

    # AC 7
    @JDB-1954
    Scenario: The correct counts are shown for the Completed today page for jcambell
      When I navigate to the login page
        And I login with "jcambell" and "password"
        Then I confirm I am on the Inbox page

      When I navigate to the Completed page

      Then the sidenav Completed today count should be "4"
        And the table caption Completed count should be "4"

    # AC 9
    @JDB-1954
    Scenario: An awaiting translation status gets counted in with replies pending
      Given I add a generated response with the juror number "123411234" and the status "AWAITING_TRANSLATION" for assignee "jcambell"

      When I navigate to the login page
        And I login with "jcambell" and "password"
        Then I confirm I am on the Inbox page

      When I navigate to the Pending page

      Then the sidenav Replies pending count should be "3"
        And the table caption Replies pending count should be "3"


