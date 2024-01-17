Feature: Edit Response Juror Details
  Allow a Bureau Officer to edit a digital summons juror details to either correct mistakes or to add additional information gathered from the juror.

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "detail-edit" data

    # Ensure page cannot be accessed prior to login. #AC1 #AC2
    When I navigate to the Details page for response "301082531"
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    When I click the entry for juror number "301082531"
      #AC4
      Then I confirm I am on the detail page

    When I choose to edit the Juror details
      Then the edit window for Juror details is open


    # Start Scenarios
    # -------------------------------------
    @ALWAYS @JDB-2265 @edit @AC6 @AC8 @AC17 @AC19 @AC20 @AC21 @AC22 @AC23 @AC24 @AC25 @AC26 @AC27 @AC28 @AC29 @AC30 @AC34
    Scenario: The user can Edit a response
      Then the edit window for Juror details has the Juror details heading
        And the edit window for Juror details has the Juror details cancel button
        And the edit window for Juror details has the Juror details save button

        And the edit window for Juror details has the Third party heading
        And the edit window for Juror details has the Third party cancel button
        And the edit window for Juror details has the Third party save button

        # Name fieldset
        And the edit window for Juror details has "Mr" for the Title
        And the edit window for Juror details has "Jake" for the First name
        And the edit window for Juror details has "Doey" for the Last name

        # Address fieldset
        And the edit window for Juror details has "Street one" for the Address 1
        And the edit window for Juror details has "Street two" for the Address 2
        And the edit window for Juror details has "Street three" for the Address 3
        And the edit window for Juror details has "Town" for the Address 4
        And the edit window for Juror details has "County" for the Address 5
        And the edit window for Juror details has "AB21 5RY" for the Postcode

        # DOB fieldset
        And the edit window for Juror details has "24" for the Day of birth
        And the edit window for Juror details has "07" for the Month of birth
        And the edit window for Juror details has "1985" for the Year of birth

        # Phone fieldset
        And the edit window for Juror details has "0141 123 4323" for the Main phone
        And the edit window for Juror details has "0141 123 4324" for the Alternative phone

        # Email fieldset
        And the edit window for Juror details has "jake.doey@mystery.gov" for the Email address
        And the edit window for Juror details has "jake.doey@mystery.gov" for the Email address confirmation

        # Third party name fieldset
        And the edit window for Juror details has "Steve" for the third party First name
        And the edit window for Juror details has "Doey" for the third party Last name

        # Third party relationship fieldset
        And the edit window for Juror details has "Brother" for the third party Relationship

        # Third party reason fieldset
        And the edit window for Juror details has the Other third party reason selected
        And the edit window for Juror details has "Holiday reason" for the third party Reason details

        # Third party phone fieldset
        And the edit window for Juror details has "01411411414" for the third party main phone
        And the edit window for Juror details has "01411411415" for the third party other phone

        # Third party email fieldset
        And the edit window for Juror details has "steve.doey@mystery.gov" for the third party email address
        And the edit window for Juror details has "steve.doey@mystery.gov" for the third party email address confirmation


      # Name fieldset
      When I set the value for the Title to "Mrr" on the edit window for Juror details
        And I set the value for the First name to "Jakey" on the edit window for Juror details
        And I set the value for the Last name to "Doeyy" on the edit window for Juror details

        # Address fieldset
        And I set the value for the Address 1 to "Street one one" on the edit window for Juror details
        And I set the value for the Address 2 to "Street two two" on the edit window for Juror details
        And I set the value for the Address 3 to "Street three three" on the edit window for Juror details
        And I set the value for the Address 4 to "Town town" on the edit window for Juror details
        And I set the value for the Address 5 to "County county" on the edit window for Juror details
        And I set the value for the Postcode to "AB21 6RY" on the edit window for Juror details

        # DOB fieldset
        And I set the value for the Day of birth to "25" on the edit window for Juror details
        And I set the value for the Month of birth to "08" on the edit window for Juror details
        And I set the value for the year of birth to "1986" on the edit window for Juror details

        # Phone fieldset
        And I set the value for the Main phone to "0141 123 4329" on the edit window for Juror details
        And I set the value for the Alternative phone to "0141 123 4328" on the edit window for Juror details

        # Email fieldset
        And I set the value for the Email address to "jakey.doeyy@mystery.gov" on the edit window for Juror details
        And I set the value for the Email address confirmation to "jakey.doeyy@mystery.gov" on the edit window for Juror details

        # Third party name fieldset
        And I set the value for the third party First name to "Stevey" on the edit window for Juror details
        And I set the value for the third party Last name to "Doeyy" on the edit window for Juror details

        # Third party relationship fieldset
        And I set the value for the third party Relationship to "Brotherr" on the edit window for Juror details

        # Third party reason fieldset
        And I set the value for the third party reason to Other on the edit window for Juror details
        And I set the value for the third party Reason details to "Second reason" on the edit window for Juror details

        # Third party phone fieldset
        And I set the value for the third party main phone to "0141 141 1419" on the edit window for Juror details
        And I set the value for the third party other phone to "0141 141 1418" on the edit window for Juror details

        # Third party email fieldset
        And I set the value for the third party email address to "stevey.doeyy@mystery.gov" on the edit window for Juror details
        And I set the value for the third party email address confirmation to "stevey.doeyy@mystery.gov" on the edit window for Juror details


      When I save my changes to Juror details

      Then the modal should be on screen
        And the change log save button is disabled

      When I provide my change log reason as "This is a test reason for making a change"
        Then the change log save button is enabled

      When I save my change log reason
        Then the modal should not be on screen

      When I switch to the Log tab
        And I switch to the change log sub tab

      Then the change log sub tab has a count of "1"
        And the 1st change log entry has a valid date
        And the 1st change log entry has a valid time
        And the 1st change log entry is by "Samantha Kirkwood"
        And the 1st change log entry has the reason "This is a test reason for making a change"

        And the 1st change log has an entry for "Title" with the new value "Mrr"
        And the 1st change log has an entry for "Title" with the old value "Mr"

        And the 1st change log has an entry for "First Name" with the new value "Jakey"
        And the 1st change log has an entry for "First Name" with the old value "Jake"

        And the 1st change log has an entry for "Last Name" with the new value "Doeyy"
        And the 1st change log has an entry for "Last Name" with the old value "Doey"

        And the 1st change log has an entry for "Address" with the new value "Street one one"
        And the 1st change log has an entry for "Address" with the old value "Street one"

        And the 1st change log has an entry for "Address2" with the new value "Street two two"
        And the 1st change log has an entry for "Address2" with the old value "Street two"

        And the 1st change log has an entry for "Address3" with the new value "Street three three"
        And the 1st change log has an entry for "Address3" with the old value "Street three"

        And the 1st change log has an entry for "Address4" with the new value "Town town"
        And the 1st change log has an entry for "Address4" with the old value "Town"

        And the 1st change log has an entry for "Address5" with the new value "County county"
        And the 1st change log has an entry for "Address5" with the old value "County"

        And the 1st change log has an entry for "Postcode" with the new value "AB21 6RY"
        And the 1st change log has an entry for "Postcode" with the old value "AB21 5RY"

        #And the 1st change log has an entry for "Date Of Birth" with the new value "25/08/1986"
        And the 1st change log has an entry for "Date Of Birth" with the old value "24/07/1985"

        And the 1st change log has an entry for "Phone Number" with the new value "0141 123 4329"
        And the 1st change log has an entry for "Phone Number" with the old value "0141 123 4323"

        And the 1st change log has an entry for "Alt Phone Number" with the new value "0141 123 4328"
        And the 1st change log has an entry for "Alt Phone Number" with the old value "0141 123 4324"

        And the 1st change log has an entry for "Email" with the new value "jakey.doeyy@mystery.gov"
        And the 1st change log has an entry for "Email" with the old value "jake.doey@mystery.gov"

        And the 1st change log has an entry for "Third Party First Name" with the new value "Stevey"
        And the 1st change log has an entry for "Third Party First Name" with the old value "Steve"

        And the 1st change log has an entry for "Third Party Last Name" with the new value "Doeyy"
        And the 1st change log has an entry for "Third Party Last Name" with the old value "Doey"

        And the 1st change log has an entry for "Relationship" with the new value "Brotherr"
        And the 1st change log has an entry for "Relationship" with the old value "Brother"

        And the 1st change log has an entry for "Third Party Other Reason" with the new value "Second reason"
        And the 1st change log has an entry for "Third Party Other Reason" with the old value "Holiday reason"

        And the 1st change log has an entry for "Main Phone" with the new value "0141 141 1419"
        And the 1st change log has an entry for "Main Phone" with the old value "01411411414"

        And the 1st change log has an entry for "Other Phone" with the new value "0141 141 1418"
        And the 1st change log has an entry for "Other Phone" with the old value "01411411415"

        And the 1st change log has an entry for "Email Address" with the new value "stevey.doeyy@mystery.gov"
        And the 1st change log has an entry for "Email Address" with the old value "steve.doey@mystery.gov"


        # Check database to ensure data has not copied across
        And I check the "JUROR.POOL" table for "Mr" within the "TITLE" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Jake" within the "FNAME" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Doe" within the "LNAME" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "24/07/1984" within the "DOB" date field with format "DD/MM/YYYY" for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "First street" within the "ADDRESS" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Second street" within the "ADDRESS2" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Third street" within the "ADDRESS3" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Mystery town" within the "ADDRESS4" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Mystery county" within the "ADDRESS5" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "AB21 4RY" within the "ZIP" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "0141 123 4321" within the "H_PHONE" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "0141 123 4322" within the "M_PHONE" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "jake.doe@mystery.gov" within the "H_EMAIL" field for "PART_NO" "301082531"


        # Mark as completed
      When I switch to the Response tab
        And I select the "Responded" Process reply option

      Then the modal should be on screen

      When I accept the juror as responded
        And I click the Mark as completed button

      Then the modal should not be on screen
        And the response status is "Completed"
        And the response does not have the Process reply dropdown
        And the record status is "Responded" on the detail page


        # Check database to ensure data has copied across
        And I check the "JUROR.POOL" table for "Mrr" within the "TITLE" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Jakey" within the "FNAME" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Doeyy" within the "LNAME" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "25/08/1986" within the "DOB" date field with format "DD/MM/YYYY" for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Street one one" within the "ADDRESS" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Street two two" within the "ADDRESS2" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Street three three" within the "ADDRESS3" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "Town town" within the "ADDRESS4" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "County county" within the "ADDRESS5" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "AB21 6RY" within the "ZIP" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "0141 123 4329" within the "H_PHONE" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "0141 123 4328" within the "W_PHONE" field for "PART_NO" "301082531"
        And I check the "JUROR.POOL" table for "jakey.doeyy@mystery.gov" within the "H_EMAIL" field for "PART_NO" "301082531"

      # Ensure can no longer edit
      When I switch to the Juror details tab
        Then the edit button for Juror details is not visible

      When I switch to the Eligibility tab
        Then the edit button for Eligibility is not visible

      When I switch to the Deferral or excusal tab
        Then the edit button for Deferral or excusal is not visible

      When I switch to the CJS Employee tab
        Then the edit button for CJS employee is not visible

      When I switch to the Reasonable adjustment tab
        Then the edit button for Reasonable adjustments is not visible

    @JDB-2265 @edit @AC4
    Scenario: Teal bar denoting the Officer should address this section should be present in edit mode
      Then the edit window for Juror details has the Name section highlighted for attention
        And the edit window for Juror details has the Address section highlighted for attention
        And the edit window for Juror details has the Date of Birth section highlighted for attention
        And the edit window for Juror details has the Phone section highlighted for attention
        And the edit window for Juror details has the Email section highlighted for attention

        And the edit window for Juror details has the third party Name section highlighted for attention
        And the edit window for Juror details has the third party Relationship section highlighted for attention
        And the edit window for Juror details has the third party Reason section highlighted for attention
        And the edit window for Juror details has the third party Phone section highlighted for attention
        And the edit window for Juror details has the third party Other phone section highlighted for attention
        And the edit window for Juror details has the third party Email section highlighted for attention

    @JDB-2265 @edit @AC15
    Scenario: If the Bureau Officer chooses third party phone details, the existing juror numbers are retained
      Then the edit window for Juror details has "0141 123 4323" for the Main phone
        And the edit window for Juror details has "0141 123 4324" for the Alternative phone

      When I choose to use third party details for the juror phone numbers
        And I choose to use juror details for the juror phone numbers

      Then the edit window for Juror details has "0141 123 4323" for the Main phone
        And the edit window for Juror details has "0141 123 4324" for the Alternative phone

    @JDB-2265 @edit @AC15
    Scenario: If the Bureau Officer chooses third party email details, the existing juror email address is retained
      Then the edit window for Juror details has "jake.doey@mystery.gov" for the Email address
        And the edit window for Juror details has "jake.doey@mystery.gov" for the Email address confirmation

      When I choose to use third party details for the juror email address
        And I choose to use juror details for the juror email address

      Then the edit window for Juror details has "jake.doey@mystery.gov" for the Email address
        And the edit window for Juror details has "jake.doey@mystery.gov" for the Email address confirmation

    @JDB-2265 @edit @AC15
    Scenario Outline: If the Bureau Officer alters the third party reason, any 'other' details are retained
      Then the edit window for Juror details has the Other third party reason selected
        And the edit window for Juror details has "Holiday reason" for the third party Reason details

      When I set the value for the third party reason to <reason> on the edit window for Juror details
        Then the edit window for Juror details has the <reason> third party reason selected

      When I set the value for the third party reason to Other on the edit window for Juror details

      Then the edit window for Juror details has the Other third party reason selected
        And the edit window for Juror details has "Holiday reason" for the third party Reason details

      Examples:
      | reason              |
      | Not here            |
      | Assistance required |
      | Death               |

    @JDB-2265 @edit @AC16
    Scenario Outline: <field> should have matching validation in line with the public application
      When I set the value for the <field> to "<value>" on the edit window for Juror details
        And I save my changes to Juror details

      Then the edit window for Juror details has the detailed error message "<message>" for the <field>

      Examples:
      | field       | value     | message                       |
      | Title       |           |                               |
      | Title       | \|Mr      | Please check the title        |

      | First name  |           | Please provide the first name |
      | First name  | \|Joe     | Please check the first name   |

      | Last name   |           | Please provide the last name  |
      | Last name   | \|Bloggs  | Please check the last name    |

      | Address 1 | | Please provide the first line of the address |
      | Address 1 | \|Address 1 example | Please check the first line of the address |

      | Address 2 | |  |
      | Address 2 | \|Address 2 example | Please check the second line of the address |

      | Address 3 | |  |
      | Address 3 | \|Address 3 example | Please check the third line of the address |

      | Address 4 | | Please provide the Town or City |
      | Address 4 | \|Address town example | Please check the Town or City |

      | Address 5 | |  |
      | Address 5 | \|County example | Please check the county |

      | Postcode | | Please provide the postcode |
      | Postcode | \|G42 | Please check the postcode |

      | Day of birth | | Please enter the day the person was born |
      | Month of birth | | Please enter the month the person was born |
      | Year of birth | | Please enter the year the person was born |

      | Main phone | \|014598746 | Please check the main phone |

      | Alternative phone | | |
      | Alternative phone | \|014598746 | Please check the other phone number |

      | Email address | \|test@email.com | Please check the email address |

      | Email address confirmation | test@email.come | The email address you entered doesn't match the email address in the box above. |

    @JDB-2265 @edit @AC17 @AC18
    Scenario: Upon hitting ‘cancel’ any changes made to the section whilst in edit mode will be discarded and the last saved values will persist.
      When I set the value for the Title to "Mrr" on the edit window for Juror details
        And I click the Cancel button
      When I choose to edit the Juror details
      And the edit window for Juror details has "Mr" for the Title

    @JDB-2265 @edit @AC32
    Scenario: If the officer changes the radio button from 'Use juror details' to 'Use third party details', the juror details must still be retained within the appropriate fields and not removed
      When I select Use Third Party Details for main phone
        And I save my changes to Juror details
      Then the modal should be on screen
      When I provide my change log reason as "This is a test reason for making a change"
        Then the change log save button is enabled
      When I save my change log reason
        Then the modal should not be on screen
      When I choose to edit the Juror details
        Then the edit window for Juror details is open
      When I select Use Juror Details for main phone
        Then the Juror phone number field equals "0141 123 4323"

    @JDB-2766 @edit
    Scenario: If the officer changes the radio button from 'Use juror details' to 'Use third party details', the juror details should show the third party phone numbers (even if a Juror phone number exists)
      When I go directly to the "/response/123456789" page
        Then the juror primary phone is "333333333" on the detail page
        And the juror secondary phone is "333333334" on the detail page

      When I choose to edit the Juror details
      And I select Use Juror Details for main phone
        Then the Juror phone number field equals "333333333"

      When I set the value for the Main phone to "111111111" on the edit window for Juror details
      And I set the value for the Alternative phone to "111111112" on the edit window for Juror details
      And I save my changes to Juror details
        Then the modal should be on screen
        And I provide my change log reason as "Entering first party phone number"
        And I save my change log reason
          Then the modal should not be on screen

      Then the juror primary phone is "111111111" on the detail page
        And the old juror primary phone is "333333333" on the detail page
        And the juror secondary phone is "111111112" on the detail page
        And the old juror secondary phone is "333333334" on the detail page

      When I choose to edit the Juror details
        And I select Use Third Party Details for main phone
        And I save my changes to Juror details
          Then the modal should be on screen
          And I provide my change log reason as "Using 3rd party phone numbers"
          And I save my change log reason
            Then the modal should not be on screen

      Then the juror primary phone is "333333333" on the detail page
        And there is no old juror primary phone on the detail page
        And the juror secondary phone is "333333334" on the detail page
        And there is no old juror secondary phone on the detail page

      When I choose to edit the Juror details
      And I select Use Juror Details for main phone
        Then the Juror phone number field equals "111111111"
        And the Juror secondary phone number field equals "111111112"

    @JDB-2768 @bug @edit
    Scenario: When editing response, there only needs to be a phone number or an email, not necessarily both
      When I navigate to the Inbox page
        And I navigate to the Details page for response "301082532"
        And I choose to edit the Juror details

      When the edit window for Juror details has "jake.doey@mystery.gov" for the Email address
        And I set the value for the Email address to "" on the edit window for Juror details
        And I set the value for the Email address confirmation to "" on the edit window for Juror details
        And I save my changes to Juror details

      Then the modal should be on screen
        And I provide my change log reason as "No email test"
        And I save my change log reason
        And the modal should not be on screen

      Then I choose to edit the Juror details
        And I set the value for the Email address to "jake.doey@mystery.gov" on the edit window for Juror details
        And I set the value for the Email address confirmation to "jake.doey@mystery.gov" on the edit window for Juror details
        And I set the value for the Main phone to "" on the edit window for Juror details
        And I set the value for the Alternative phone to "" on the edit window for Juror details
        And I save my changes to Juror details

      Then the modal should be on screen
        And I provide my change log reason as "No phone test"
        And I save my change log reason
        And the modal should not be on screen

      Then I choose to edit the Juror details
        And I set the value for the Email address to "" on the edit window for Juror details
        And I set the value for the Email address confirmation to "" on the edit window for Juror details
        And I save my changes to Juror details
        Then the edit window for Juror details has the detailed error message "Please enter the main phone number" for the Main phone
        Then the edit window for Juror details has the detailed error message "Please enter the email address" for the Email address

      @JDB-2768 @bug @edit
      Scenario: When editing response, the two emails need to match
        When I navigate to the Inbox page
          And I navigate to the Details page for response "301082532"
          And I choose to edit the Juror details

        Then I set the value for the Main phone to "" on the edit window for Juror details
          And I set the value for the Alternative phone to "" on the edit window for Juror details
          And I set the value for the Email address confirmation to "" on the edit window for Juror details
          And I save my changes to Juror details
          Then the edit window for Juror details has the detailed error message "The email address you entered doesn't match the email address in the box above." for the Email address confirmation

      @JDB-2768 @bug @edit
      Scenario: When editing a 3rd party deceased response, errors should not appear on certain empty fields
        When I navigate to the Inbox page
          And I navigate to the Details page for response "123456790"
          And I choose to edit the Juror details

        When the edit window for Juror details has "" for the Email address
          And I set the value for the Day of birth to "" on the edit window for Juror details
          And I set the value for the Month of birth to "" on the edit window for Juror details
          And I set the value for the year of birth to "" on the edit window for Juror details
          And I save my changes to Juror details

        Then the modal should be on screen
          And I provide my change log reason as "Checking validation with only 3rd party phone provided"
          And I save my change log reason
          And the modal should not be on screen

      @JDB-2131 @JDB-2850 @bug @edit
      Scenario: Teal bar denoting there are Notes and Call Logs assigned to a response should be present
        When I navigate to the Details page for response "301082532"
        And I switch to the Log tab
          Then the log tab is flagged as important
          And the notes sub tab is highlighted for attention
          And the call log sub tab is not highlighted for attention

        Then I switch to the notes sub tab
          And I press the notes edit button
          And I enter "" as the response notes
          And I press the notes save button
          And I navigate to the Details page for response "301082532"
          And I switch to the Log tab

        Then the log tab is not flagged as important
          And the notes sub tab is not highlighted for attention
          And the call log sub tab is not highlighted for attention

        Then I switch to the call log sub tab
          And I press the Log a call button
          And I enter "Test Call" as my Log a call text
          And I click the Log a call Save button
          And I navigate to the Details page for response "301082532"
          And I switch to the Log tab

        Then the log tab is flagged as important
          And the notes sub tab is not highlighted for attention
          And the call log sub tab is highlighted for attention

        Then I switch to the notes sub tab
          And I press the notes edit button
          And I enter "Test Notes" as the response notes
          And I press the notes save button
          And I navigate to the Details page for response "301082532"
          And I switch to the Log tab

        Then the log tab is flagged as important
          And the notes sub tab is highlighted for attention
          And the call log sub tab is highlighted for attention
