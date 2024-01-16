Feature: Response notes

  Display and update of notes against single Response

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
      And I switch to the notes sub tab


    # Start Scenarios
    # -------------------------------------
    @JDB-1457 @AC4
    Scenario: Under the Log Tab there will be a Note feature called ‘Notes’
      Then the notes sub tab has the title "Notes"

    @JDB-1457 @AC4.3
    Scenario: The Note feature will appear above the other features presented under the Log Tab
      Then the notes sub tab appears 1st

    @JDB-1457 @AC4.4
    Scenario: If there are no notes held on the JUROR application notes, then nothing is displayed
      When I navigate to the Inbox page
        And I click the entry for juror number "352004504"
        And I switch to the Log tab
        And I switch to the notes sub tab

      Then the notes sub tab contents shows ""

    @JDB-1457 @AC4.4
    Scenario: If there are any notes held on the JUROR application notes, these will be displayed in the Notes feature.
      Then the notes sub tab contents shows "Default notes for testing"

    @JDB-1457 @AC5
    Scenario: If an Officer selects the ‘Notes’ feature under the Log Tab on the left it will be highlighted
      Then the notes sub tab has the active state

    @JDB-1457 @AC6.1
    Scenario: The title of ‘Notes’ will be displayed on the Left Hand Side of they grey bar
      Then the notes sub tab contents has the title "Notes"

    @JDB-1457 @AC6.2
    Scenario: An ‘Edit’ feature will appear on the Right Hand Side, as a green button
      Then the notes sub tab contents has the edit button

    @JDB-1457 @AC7
    Scenario: If an Officer presses the ‘Edit’ Button, a Note pad pop-up is presented
      Then the notes textarea is disabled

      When I press the notes edit button
        Then the notes textarea is enabled

    @JDB-1457 @AC7.1
    Scenario: The title ‘Notes’ is still seen on the Left Hand Side and there will be a ‘cancel’ and ‘save’ feature on the Right Hand Side.
      Then the notes sub tab contents does not have the cancel button
        And the notes sub tab contents does not have the save button

      When I press the notes edit button

      Then the notes sub tab contents has the title "Notes"
        And the notes sub tab contents does not have the edit button
        And the notes sub tab contents has the cancel button
        And the notes sub tab contents has the save button

    @JDB-1457 @AC7.2
    Scenario: The background showing the Juror’s Detail summons view will be greyed out as only the Notes pop-up is active.
      Then the greyed out background is not visible

      When I press the notes edit button
        Then the greyed out background is visible

    @JDB-1457 @AC7.4
    Scenario: An officer will be able to update any notes previously entered, including delete the previous Notes entry.
      When I press the notes edit button

      When I append " this is a test" to the response notes
        Then the notes sub tab contents shows "Default notes for testing this is a test"

      When I enter "a second test" as the response notes
        Then the notes sub tab contents shows "a second test"

    @JDB-1457 @AC7.5
    Scenario: If an officer cancels the notes edit then the changes are reverted and the detail view will be restored
      When I press the notes edit button

      When I enter "a third test" as the response notes
        Then the notes sub tab contents shows "a third test"

      When I press the notes cancel button

      #AC7.5.1
      Then the notes textarea is disabled
        #AC7.5.2
        And the notes sub tab contents shows "Default notes for testing"
        #AC7.5.3
        And the greyed out background is not visible

    @JDB-2569
    Scenario: An officer will be able to delete notes previously entered.

      When I press the notes edit button
        And I enter "" as the response notes
      Then the notes sub tab contents shows ""

      When I press the notes save button
        Then the greyed out background is not visible
          And the notes textarea is disabled
          And the notes sub tab contents shows " "

    @JDB-1457 @optimisticlock
    Scenario: If an officer saves the notes edit then the changes are stored in the database and the detail view will be restored
      When I press the notes edit button

      When I enter "a fourth test" as the response notes
        Then the notes sub tab contents shows "a fourth test"

      When I press the notes save button

      #AC7.6.2
      Then the greyed out background is not visible
        And the notes textarea is disabled
        And the notes sub tab contents shows "a fourth test"

        #AC7.6.1
        And I check the "JUROR.POOL" table for "a fourth test" within the "NOTES" field for "PART_NO" "301082530"


      # Ensure user can make a second change without meeting the optimistic locking
      When I press the notes edit button
        And I append ". a fifth test" to the response notes
        And I press the notes save button

      Then the greyed out background is not visible
        And the notes textarea is disabled
        And the notes sub tab contents shows "a fourth test. a fifth test"
        And I check the "JUROR.POOL" table for "a fourth test. a fifth test" within the "NOTES" field for "PART_NO" "301082530"
