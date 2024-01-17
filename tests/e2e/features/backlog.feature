Feature: Backlog
  As Bureau team leaders, we want to be  able to view the total number of items in the backlog and assign them across the available Bureau officers for the following day so that each Bureau officer is provided with a list of summons responses to process.

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I generate "140" responses assigned to ""
      And I add a generated response with the juror number "112233445" and the status "TODO"
      And I add a Super Urgent response with the status "TODO" and assignee "samanthak"
      And I add an Urgent response with the status "TODO" and assignee "samanthak"

    # AC1 AC2
    When I navigate to the New Replies page
      Then I confirm I am on the Login page

    # @AC3
    When I navigate to the login page
      And I login with "samanthak" and "password"
      When I navigate to the New Replies page
      Then I confirm I am on the Inbox page

    When I navigate to the login page
      And I login with "jcambell" and "password"

    # @AC4
    When I click the Backlog navigation tab
      Then I confirm I am on the New Replies page


    # Start Scenarios
    # -------------------------------------
    @JDB-283 @AC5
    Scenario: The total number of summons responses with a status of To Do which are not already assigned to a Bureau officer and are not urgent or super urgent is displayed in the Backlog field.
      Then the total count for the backlog is "140"

    @JDB-283 @AC6
    Scenario: The number of active staff members who are not team leaders is displayed in the Staff field
      Then the total count for the staff on the backlog page is "2"

    @JDB-283 @AC7
    Scenario: The capacity field is initially calculated and displayed as the number of active staff members above multiplied by the default capacity per Bureau officer.
      Then the total count for the capacity on the backlog page is "120"

    @JDB-283 @AC9 @AC9.1
    Scenario: The body of the screen lists the active Bureau officers who are not team leaders and for each the capacity
      Then the capacity for "Samantha Kirkwood" is "60"
        And the capacity for "Molly Smith" is "60"

    @JDB-283 @AC9 @AC9.2
    Scenario: The body of the screen lists the active Bureau officers who are not team leaders and for each the urgents
      Then the urgents for "Samantha Kirkwood" is "2"
        And the urgents for "Molly Smith" is "0"

    @JDB-283 @AC9 @AC9.3
    Scenario: The body of the screen lists the active Bureau officers who are not team leaders and for each the allocation
      Then the allocations for "Samantha Kirkwood" is "62"
        And the allocations for "Molly Smith" is "60"

    @JDB-283 @AC9 @AC9.4
    Scenario: The body of the screen lists the active Bureau officers who are not team leaders and for each the incompletes
      Then the incompletes for "Samantha Kirkwood" is "3"
        And the incompletes for "Molly Smith" is "0"

    @JDB-283 @AC10
    Scenario: A Send button is available
      Then the Send button is visible on the Backlog page

    @JDB-2507
    Scenario Outline: The validation errors are removed once the user has navigated away from the Backlog page to the <destinationPage>
      When I change the number in the capacity field for "Samantha Kirkwood" to "122"
        And I click the Send button on the Backlog page
        Then the capacity summary error for "Samantha Kirkwood" is "The overall capacity must be less than or equal to the backlog total. Please reduce the capacity allocated to the individual Bureau officers so this is true." on the Backlog screen
          And the capacity for "Samantha Kirkwood" is "122"
      When I navigate to the <destinationPage> page
        And I navigate to the New Replies page
        Then the error summary list is empty on the Backlog screen
          And the capacity for "Samantha Kirkwood" is "60"
      Examples:
      | destinationPage |
      | Inbox           |
      | Search          |
      | Staff           |

    @JDB-283 @AC11
    Scenario: The user can amend the number in the Capacity column for any of the Bureau officers listed. Only positive integers or zero can be entered in the capacity fields
      When I set the number in the capacity field for "Samantha Kirkwood" to "-1"
      Then the capacity for "Samantha Kirkwood" is "1"

      When I set the number in the capacity field for "Samantha Kirkwood" to "1.1"
      Then the capacity for "Samantha Kirkwood" is "11"

    @JDB-283 @AC12
    Scenario: As the Capacity for any Bureau officer is validly changed, the overall Capacity field on the left hand side of the screen should be updated to reflect the new total of all the listed individual Bureau officer's Capacity fields.
      When I change the number in the capacity field for "Samantha Kirkwood" to "100"
        Then the total count for the capacity on the backlog page is "160"

      When I change the number in the capacity field for "Molly Smith" to "200"
        Then the total count for the capacity on the backlog page is "300"

    @JDB-283 @AC13
    Scenario: Cannot increase total capacity beyond the total backlog
      When I change the number in the capacity field for "Samantha Kirkwood" to "100"
        And I change the number in the capacity field for "Molly Smith" to "100"
        And I click the Send button on the Backlog page

      Then the exceeded capacity summary error is shown on the Backlog screen
        And the capacity for "Samantha Kirkwood" is "100"
        And the capacity for "Molly Smith" is "100"
        And the total count for the capacity on the backlog page is "200"

    @JDB-2417
    Scenario: The allocation is calculated correctly after validation error
      When I change the number in the capacity field for "Samantha Kirkwood" to "80"
        And I change the number in the capacity field for "Molly Smith" to "80"
        And I click the Send button on the Backlog page
        Then the capacity summary error for "Samantha Kirkwood" is "The overall capacity must be less than or equal to the backlog total. Please reduce the capacity allocated to the individual Bureau officers so this is true." on the Backlog screen
          And the capacity for "Samantha Kirkwood" is "80"
          And the capacity for "Molly Smith" is "80"
          And the allocations for "Samantha Kirkwood" is "82"
          And the allocations for "Molly Smith" is "80"

    @JDB-283 @AC14 @AC15 @ALWAYS
    Scenario: When the Send button is validly pressed the application must assign summons from the backlog up to the number specified in the individual capacity for each Active Bureau officer who is not a Team Leader
      Then the total count for the backlog is "140"
        And the total count for the staff on the backlog page is "2"
        And the total count for the capacity on the backlog page is "120"
        And the incompletes for "Samantha Kirkwood" is "3"
        And the incompletes for "Molly Smith" is "0"

      When I click the Send button on the Backlog page

      Then I confirm I am on the New Replies page
        And the total count for the backlog is "20"
        And the incompletes for "Samantha Kirkwood" is "63"
        And the incompletes for "Molly Smith" is "60"
