Feature: Response call logs

  Display and creation of call logs against single Response

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "detail" data

    # Ensure page cannot be accessed prior to login. #AC1 #AC2
    When I navigate to the Details page for response "301082530"
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    When I click the entry for juror number "301082530"
      And I switch to the Log tab
      And I switch to the call log sub tab


    # Start Scenarios
    # -------------------------------------
    @JDB-2355 @AC4
    Scenario: Under the Log Tab there will be a call logging feature called 'Call log'
      Then the call log sub tab has the title "Call log"

    @JDB-2355 @AC4.1
    Scenario: The call log sub tab will have an incremental counting feature to display the number of calls logged
      Then the call log sub tab has a count of "2"

    @JDB-2355 @AC4.5
    Scenario: If there are no Call logs are recorded to a Juror’s digital summons response then the value shown in the counter will display ‘0’ (default setting).
      When I go directly to the "/response/309092530" page
        And I switch to the Log tab
        And I switch to the notes sub tab

      Then the call log sub tab has a count of "0"

    @JDB-2355 @AC4.6 @AC6.3
    Scenario: If there are any calls held on the JUROR application phone logs, these will be displayed in the Call log content area
      Then the call log content shows correct information

    @JDB-2355 @AC5
    Scenario: If an Officer selects the ‘Call log’ feature under the Log Tab on the left it will be highlighted
      Then the call log sub tab has the active state

    @JDB-2355 @AC6
    Scenario: A ‘Log a call’ feature will appear on the Right Hand Side, as a green button
      Then the call log sub tab contents has the Log a call button

    @JDB-2355 @AC6.1
    Scenario: If there are no call logged the space under the title will be blank, and the ‘Call log’ counter will register at ‘0’.
      When I go directly to the "/response/309092530" page
        And I switch to the Log tab
        And I switch to the notes sub tab

      Then the call log sub tab has a count of "0"
        And the call log content area will not have a call log table

    @JDB-2355 @AC6.2
    Scenario: The Bureau officer will be alerted to call(s) being present when there is a value in the ‘Call log’ counter.
      Then the log tab is flagged as important

    @JDB-2355 @AC7.1
    Scenario: Pressing the ‘Log a call’ button will present the user with a pop up
      When I press the Log a call button
        Then the modal should be on screen

    @JDB-2355 @AC7.1.1 @AC7.1.2 @AC7.1.3
    Scenario: Guidance will be present which states “Please provide notes for the call”
      When I press the Log a call button

      Then the Log a call help text displays "Please provide notes for the call"
        And the Log a call textarea is displayed
        And the Log a call Cancel button is displayed
        And the Log a call Save button is displayed

    @JDB-2355 @AC7.1.3.A
    Scenario: If the officer clicks the cancel button, the pop-up will close
      When I press the Log a call button
        Then the modal should be on screen

      When I click the Log a call Cancel button
        Then the modal should not be on screen

    @JDB-2355 @AC7.1.3.B
    Scenario: If the officer clicks the save button and has entered notes, the pop-up will close and the page will show the call log will show the new entry
      When I press the Log a call button

      Then the modal should be on screen
        And the Log a call Save button is disabled

      When I enter "Automated log entry" as my Log a call text
        Then the Log a call Save button is enabled

      When I click the Log a call Save button

      Then the modal should not be on screen
        And the 1st call log has the note "Automated log entry"
        And I check that "JUROR.PHONE_LOG" table has a result for "PART_NO" "301082530" AND "USER_ID" "samanthak"
        And I check that "JUROR.PHONE_LOG" table has a result for "PART_NO" "301082530" AND "NOTES" "Automated log entry"
