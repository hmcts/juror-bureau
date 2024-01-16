Feature: Response change logs

  As a Bureau Officer, I want to be able to update the Notes and Log on a summons response from within the Bureau Interface, so that I do not have to go into Juror to do it

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "detail" data

    # Ensure page cannot be accessed prior to login. #AC1 #AC2
    When I navigate to the Details page for response "209092530"
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    When I click the entry for juror number "209092530"
      And I switch to the Log tab
      And I switch to the change log sub tab


    # Start Scenarios
    # -------------------------------------
    @JDB-2356 @AC4
    Scenario: Under the Log Tab there will be a change logging feature called 'Change log'
      Then the change log sub tab has the title "Change log"

    @JDB-2356 @AC4.1
    Scenario: The change log sub tab will have an incremental counting feature to display each time a change is saved
      Then the change log sub tab has a count of "2"

    @JDB-2356 @AC4.5 @AC9.1
    Scenario: If there are no changes recorded to a jurors digital summons then the value shown in the counter will display 0
      When I go directly to the "/response/309092530" page
        And I switch to the Log tab
        And I switch to the change log sub tab

      Then the change log sub tab has a count of "0"
        And the change log content area will have 0 change logs

    @JDB-2356 @AC9.4
    Scenario: The Change Log view will then show any edits an Officer has made to digital summons reply.
      Then the change log content area will have 2 change logs

    @JDB-2356 @AC9.5
    Scenario: The change log view will show the correct information
      Then the change log will have a valid date and time
        And the change log will be by staff member "Samantha Kirkwood"

    @JDB-2356 @AC9.5.1
    Scenario: The change log view show items in chronological order, newest first
      Then the change log items will be displayed newest first
