Feature: Team lead Search reassignment page

   As a Bureau team leader, I want to be able to change  the assignment on multiple summons responses in one go to save me time

   Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "search" data

    When I navigate to the Search page
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "jcambell" and "password"
      Then I confirm I am on the Inbox page

    When I click the Search navigation tab
      Then I confirm I am on the Search page

    When I enter "AB2" into the Postcode search box
        And I click the search button


    # Start Scenarios
    # -------------------------------------
    @JDB-2503 @AC1 @assign
    Scenario Outline: The Send to button is not initially active after navigating to <destinationPage>
      When I navigate to the <destinationPage> page
        And I navigate to the Search page
      Then the search filters have the search button disabled
        And the search filters have the clear all button disabled
      Examples:
      | destinationPage |
      | Inbox           |
      | New Replies         |
      | Staff           |

    @JDB-2014 @AC1 @assign
    Scenario: A Send to button, Select all and Deselect all links should be available
      Then the Multi send to button is visible
        And the Select all link is visible
        And the Deselect all link is visible

    @JDB-2565 @AC1 @assign
    Scenario: The Clear all button resets the form after navigating to the response details
      Given I click the entry for juror number "123456786"
        And I navigate to the Search page
        And I click the clear all filters button
      Then I have "" for the Juror number search condition
        And I have "" for the Last name search condition
        And I have "" for the Postcode search condition
        And I have "" for the Pool number search condition
        And I have "" for the Officer assigned search condition
        And the Urgent filter is disabled
        And the To do filter is disabled
        And the Awaiting juror filter is disabled
        And the Awaiting court reply filter is disabled
        And the Awaiting translation filter is disabled
        And the Completed filter is disabled
        And the search filters have the search button disabled
        And the search filters have the clear all button disabled

    @JDB-2014 @AC1 @assign
    Scenario: The Send to button is not initially active
      Then the Multi send to button is disabled

    @JDB-2561 @AC1 @assign
    Scenario: The Send to button is inactive after a search
      When I click the Select all link
        And I click the search button
      Then the Multi send to button is disabled

    @JDB-2014 @AC1 @assign
    Scenario: If the status of a summons response is not Closed then a check box should be provided and not be selected
      Then the search result for Juror number "123456789" has a checkbox
        And the search result for Juror number "123456789" has the checkbox unchecked

    @JDB-2014 @AC1 @assign
    Scenario: If the status of a summons response is Closed then a check box should not be provided
      Given I add a generated response with the juror number "123011234" and the status "CLOSED" for assignee "jcambell"

      When I enter "AB2" into the Postcode search box
        And I click the search button

      Then the search result for Juror number "123011234" does not have a checkbox

    @JDB-2014 @AC1 @assign
    Scenario: If the Select all link is clicked on by the user then all the check boxes should be marked as selected
      When I click the Select all link
      Then all responses have been selected

    @JDB-2014 @AC1 @assign
    Scenario: If the Deselect all link is clicked on by the user then all the check boxes should be marked as not selected
      When I click the Select all link
        Then all responses have been selected

      When I click the Deselect all link
        Then all responses have not been selected

    @JDB-2014 @AC1 @assign
    Scenario: The Send to button is only active if at least one of the check boxes has been checked
      When I click the Select all link
        Then the Multi send to button is enabled

      When I click the Deselect all link
        And I click the checkbox for Juror number "123456789"
        Then the Multi send to button is enabled

      When I click the Deselect all link
        Then the Multi send to button is disabled

    @JDB-2014 @AC1 @assign
    Scenario: If the user clicks on the Send to button then a pop-up is displayed
      When I click the Select all link
        And I click the Multi send to button

      Then the modal should be on screen

    # @JDB-2014 @AC1 @assign @broken
    # Scenario: At the top of the pop up it should say "Send n responses to" where n is the number of selected items for the update
    #   When I click the Select all link
    #     And I click the Multi send to button

    #   Then the modal should be on screen
    #     And the modal title should be "Send 4 summonses to"

    # @JDB-2014 @AC1 @assign @broken
    # Scenario: The pop up must provide a check box labelled 'The backlog'
    #   When I click the Select all link
    #     And I click the Multi send to button

    #   Then the modal should be on screen
    #     And the modal Backlog checkbox is visible

    # @JDB-2014 @AC1 @assign @broken
    # Scenario: The pop up must provide a dropdown beneath the backlog which includes a list of all the active staff members showing the member's name and it should be in alphabetical order
    #   When I click the Select all link
    #     And I click the Multi send to button

    #   Then the modal should be on screen
    #     And the Assign to dropdown is visible
    #     And the 1st asignee is "James Cambell"
    #     And the 2nd asignee is "Molly Smith"
    #     And the 3rd asignee is "Samantha Kirkwood"

    # @JDB-2014 @AC1 @assign @broken
    # Scenario: If the user clicks the Backlog option, any staff member selections are cleared
    #   When I click the Select all link
    #     And I click the Multi send to button

    #   Then the modal should be on screen
    #     And the Assign to dropdown is visible

    #   When I select "James Cambell" as the assignee for each of the responses
    #     And I select the Backlog checkbox

    #   Then the assignee for each of the responses is "A team member"
    #     And the modal Backlog checkbox is enabled

    # @JDB-2014 @AC1 @assign @broken
    # Scenario: If the user chooses a staff member, the Backlog option is deselected
    #   When I click the Select all link
    #     And I click the Multi send to button

    #   Then the modal should be on screen
    #     And the Assign to dropdown is visible

    #   When I select the Backlog checkbox
    #     And I select "James Cambell" as the assignee for each of the responses

    #   Then the assignee for each of the responses is "James Cambell"
    #     And the modal Backlog checkbox is disabled

    @JDB-2014 @AC1 @assign
    Scenario: The user should be provided with a Cancel and a Send button on the pop up
      When I click the Select all link
        And I click the Multi send to button

      Then the modal should be on screen
        And the Modal Cancel button is visible
        And the Modal Send button is visible

    @JDB-2014 @AC1 @assign
    Scenario: If the user clicks on the Cancel button the pop up is closed
      When I click the Select all link
        And I click the Multi send to button

      Then the modal should be on screen
        And the Modal Cancel button is visible

      When I click the Modal Cancel button
        Then the modal should not be on screen

    # @ALWAYS @JDB-2014 @AC1 @assign @broken
    # Scenario: For an update to the backlog then each selected response should have the assignment removed and the pop up should close. The search should be refreshed
    #   When I click the Select all link
    #     And I click the Multi send to button

    #   Then the modal should be on screen

    #   When I select the Backlog checkbox
    #     And I click the Modal Send button

    #   Then the modal should not be on screen
    #     And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456786"
    #     And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456787"
    #     And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456788"
    #     And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456789"

    @JDB-2567
    Scenario: Multi select still usable after selecting response then going back
      Given I enter "Rivera" into the Last name search box
        And I click the search button
      When I click the response for Juror number "123456787"
        And I click the back link on the detail page
      Then I confirm I am on the Search page
      When I click the checkbox for Juror number "123456787"
        Then I confirm that the first response have been selected
          And I confirm I am on the Search page

    @JDB-2014 @AC1 @assign
    Scenario Outline: For an update to staff member <memberName> then each selected response should have the assignment set to the given staff member and the pop up should close. The search should be refreshed
      When I click the Select all link
        And I click the Multi send to button

      Then the modal should be on screen

      When I select "<memberName>" as the assignee for each of the responses
        And I click the Modal Send button

      Then the modal should not be on screen
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "<memberLogin>" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456786"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "<memberLogin>" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456787"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "<memberLogin>" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456788"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "<memberLogin>" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "123456789"

      Examples:
      | memberName        | memberLogin |
      | James Cambell     | jcambell    |
      | Molly Smith       | msmith      |
      | Samantha Kirkwood | samanthak   |
