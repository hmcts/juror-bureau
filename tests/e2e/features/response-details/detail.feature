Feature: Response details
  As a Bureau Officer, I want to see the full details of a response received by the Bureau

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "detail" data
      And I add a Super Urgent response with the status "AWAITING_CONTACT" and assignee "samanthak"
      And I add an Urgent response with the status "CLOSED" and assignee "samanthak"
      And I add a generated response with the juror number "123456789" and the status "TODO"
      And I add a generated response with the juror number "223456789" and the status "AWAITING_CONTACT"
      And I add a generated response with the juror number "323456789" and the status "AWAITING_TRANSLATION"
      And I add a generated response with the juror number "423456789" and the status "AWAITING_COURT_REPLY"
      And I add a generated response with the juror number "523456789" and the status "CLOSED"

      And I add a generated response with the juror number "123001234", the status "TODO" and the POOL status "1"
      And I add a generated response with the juror number "123011234", the status "CLOSED" and the POOL status "2"
      And I add a generated response with the juror number "123021234", the status "CLOSED" and the POOL status "3"
      And I add a generated response with the juror number "123031234", the status "CLOSED" and the POOL status "4"
      And I add a generated response with the juror number "123041234", the status "CLOSED" and the POOL status "5"
      And I add a generated response with the juror number "123051234", the status "CLOSED" and the POOL status "6"
      And I add a generated response with the juror number "123061234", the status "CLOSED" and the POOL status "7"
      And I add a generated response with the juror number "123071234", the status "CLOSED" and the POOL status "8"
      And I add a generated response with the juror number "123081234", the status "CLOSED" and the POOL status "9"
      And I add a generated response with the juror number "123091234", the status "CLOSED" and the POOL status "10"
      And I add a generated response with the juror number "123101234", the status "CLOSED" and the POOL status "11"

      And I add a generated response with the juror number "123241234" and the status "TODO" for assignee "jcambell"

    # Ensure page cannot be accessed prior to login
    When I navigate to the login page
      And I login with "" and ""
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page


    # Start Scenarios
    # -------------------------------------
    @JDB-2436
    Scenario: The back link returns to the inbox page
      When I click the entry for juror number "209092530"
        And I switch to the Log tab
        And I switch to the Response tab
        And I click the inbox link on the detail page
      Then I confirm I am on the Inbox page

    @JDB-2436
    Scenario Outline: The back link returns to the pending page after navigating to the response details for juror <jurorNumber>
      When I click the sidenav Replies pending link
        Then I confirm I am on the Pending page
      When I click the entry for juror number "<jurorNumber>"
        And I switch to the Log tab
        And I switch to the Response tab
        And I click the pending link on the detail page
      Then I confirm I am on the Pending page
      Examples:
      | jurorNumber |
      | 223456789   |
      | 323456789   |
      | 423456789   |

    @JDB-2436
    Scenario: The back link returns to the completed page
      When I click the sidenav Completed today link
        Then I confirm I am on the Completed page
      When I click the entry for juror number "321321321"
        And I switch to the Log tab
        And I switch to the Response tab
        And I click the complete link on the detail page
      Then I confirm I am on the Completed page

    @JDB-1872 @ALWAYS
    Scenario: Ensure data is displayed correctly for a response with straight through data
      When I click the entry for juror number "209092530"
        Then I confirm I am on the detail page

      When I switch to the Response tab

      # Summary
      Then the display name is "Jane Castillo" on the detail page
        And the juror number is "209092530" on the detail page
        And the record status is "Summoned" on the detail page
        And the date received is today on the detail page
        And the pool number is "555" on the detail page
        And the court date is "60" days from now on the detail page
        And the court name is "PLYMOUTH" on the detail page

      # Juror details
      Then I switch to the Juror details tab
        And the juror name is "Dr Jane Castillo" on the detail page
        And there is no old juror name on the detail page
        And the juror address is "4 Knutson Trail, Scotland, Aberdeen, United Kingdom, AB21 3RY" on the detail page
        And there is no old juror address on the detail page
        And the juror date of birth is "24/07/1984" on the detail page
        And there is no old juror date of birth on the detail page
        And the juror age is shown as "33" on the detail page
        And the juror primary phone is "44(703)209-6993" on the detail page
        And there is no old juror primary phone on the detail page
        And the juror secondary phone is "44(145)525-2390" on the detail page
        And there is no old juror secondary phone on the detail page
        And the juror email address is "jcastillo0@ed.gov" on the detail page
        And there is no old juror email address on the detail page

      # Eligibility
      Then I switch to the Eligibility tab
        And the juror eligibility for Residency has "OK" on the detail page
        And the juror eligibility for Mental health has "OK" on the detail page
        And the juror eligibility for Bail has "OK" on the detail page
        And the juror eligibility for Convictions has "OK" on the detail page

      # Confirmed dates
      Then I switch to the Deferral or excusal tab
        And the juror summons date has "Date of jury service confirmed" on the detail page

      # CJS employment
      Then I switch to the CJS Employee tab
        And the juror CJS Employment has "N/A" on the detail page

      # Reasonable adjustments
      Then I switch to the Reasonable adjustment tab
        And the juror Disability or impairement has "N/A" on the detail page
        And the juror Reasonable adjustment is "N/A" on the detail page

    @JDB-1872 @ALWAYS
    Scenario: Ensure data is displayed correctly for a third party response
      When I click the entry for juror number "309092530"
        Then I confirm I am on the detail page

      # Juror details
      When I switch to the Juror details tab
        And the juror name is "Dr Jon Doey" on the detail page
        And the juror address is "5 Trail Street, Aberdeen, Scotland, United Kingdom, AB21 5RY" on the detail page
        And the juror date of birth is "24/07/1985" on the detail page
        And the juror primary phone is "44(703)209-6994" on the detail page
        And the juror secondary phone is "44(145)525-2391" on the detail page
        And the juror email address is "jon.doey@mystery.gov" on the detail page

        And the third party name is "Frank Doey" on the detail page
        And the third party relationship is "Brother" on the detail page
        And the third party reason is "Juror is not here" on the detail page
        And the third party main phone is "01411411414" on the detail page
        And the third party other phone is "01411411415" on the detail page
        And the third party email is "frank.doey@mystery.gov" on the detail page

        And the third party name is flagged as important on the detail page
        And the third party relationship is flagged as important on the detail page
        And the third party reason is flagged as important on the detail page
        And the third party main phone is flagged as important on the detail page
        And the third party other phone is flagged as important on the detail page
        And the third party email is flagged as important on the detail page

    Scenario: Ensure that a response with changes does show a new and old value for fields
      When I click the entry for juror number "309092530"

      # Summary
      Then the display name is "Jon Doey" on the detail page
        And the juror number is "309092530" on the detail page
        And the record status is "Summoned" on the detail page
        And the date received is today on the detail page
        And the pool number is "555" on the detail page
        And the court date is "60" days from now on the detail page
        And the court name is "PLYMOUTH" on the detail page

      # Juror details
      Then I switch to the Juror details tab
        And the juror name is "Dr Jon Doey" on the detail page
        And the old juror name is "Mr John Doe" on the detail page

        And the juror address is "5 Trail Street, Aberdeen, Scotland, United Kingdom, AB21 5RY" on the detail page
        And the old juror address is "4 Trail Street, Scotland, Aberdeen, United Kingdom, AB21 4RY" on the detail page

        And the juror date of birth is "24/07/1985" on the detail page
        And the old juror date of birth is "24/07/1984" on the detail page

        And the juror primary phone is "44(703)209-6994" on the detail page
        And the old juror primary phone is "44(703)209-6993" on the detail page

        And the juror secondary phone is "44(145)525-2391" on the detail page
        And the old juror secondary phone is "44(145)525-2390" on the detail page

        And the juror email address is "jon.doey@mystery.gov" on the detail page
        And the old juror email address is "john.doe@mystery.gov" on the detail page

    Scenario: Ensure that an ineligible response shows the correct information
      When I click the entry for juror number "309092530"

      Then the status flag is "Ineligible"
        And the Juror details tab is flagged as important
        And the Eligibility tab is flagged as important
        And the Deferral or excusal tab is flagged as important
        And the CJS Employee tab is flagged as important
        And the Reasonable adjustment tab is flagged as important

      Then I switch to the Eligibility tab
        And the juror eligibility for Residency has "I have lived here for 3 years" on the detail page
        And the juror eligibility for Mental health has "I am mentally detained" on the detail page
        And the juror eligibility for Bail has "I am on bail" on the detail page
        And the juror eligibility for Convictions has "I have been convicted" on the detail page

    Scenario: Ensure that a response with a deferral shows the correct information
      When I click the entry for juror number "309092530"

      Then I switch to the Deferral or excusal tab
        And the juror summons date has "Deferral request" on the detail page
        And the juror summons date has "I am busy with exams" on the detail page
        And the 1st available date for the juror is "06/06/2017"
        And the 2nd available date for the juror is "06/07/2017"
        And the 3rd available date for the juror is "06/08/2017"

    Scenario: Ensure that a response with an excusal shows the correct information
      When I navigate to the login page

      Then I login with "jcambell" and "password"
        And I confirm I am on the Inbox page
        And I navigate to the Pending page
        And I click the entry for juror number "409092530"

      Then the status flag is "Excusal"

      Then I switch to the Deferral or excusal tab
        And the juror summons date has "Excusal request" on the detail page
        And the juror summons date has "I have stress induced anxiety" on the detail page

    Scenario: Ensure that a response with CJS employment details shows the correct information
      When I click the entry for juror number "309092530"

      Then I switch to the CJS Employee tab
        And the juror CJS Employment has "HM Prison Service" on the detail page
        And the juror CJS Employment has "Prison guard" on the detail page

    Scenario: Ensure that a response with reasonable adjustments shows the correct information
      When I click the entry for juror number "309092530"

      Then I switch to the Reasonable adjustment tab
        And the juror Disability or impairement has "DIET" on the detail page
# FIXME: JDB-1895 commented out the step to check the detail field as it does not exist in the public interface (sprint 12)
#        And the juror Disability or impairement has "the juror seems to have severe allergy to nuts. Caution needed during lunch" on the detail page
        And the juror Reasonable adjustment is "Even more special reasons" on the detail page

    Scenario: Ensure that a response with status 1 shows "Summoned"
      When I go directly to the "/response/123001234" page
      Then the record status is "Summoned" on the detail page

    Scenario: Ensure that a response with status 2 shows "Responded"
      When I go directly to the "/response/123011234" page
      Then the record status is "Responded" on the detail page

    Scenario: Ensure that a response with status 3 shows "Panel"
      When I go directly to the "/response/123021234" page
      Then the record status is "Panel" on the detail page

    Scenario: Ensure that a response with status 4 shows "Juror"
      When I go directly to the "/response/123031234" page
      Then the record status is "Juror" on the detail page

    Scenario: Ensure that a response with status 5 shows "Excused"
      When I go directly to the "/response/123041234" page
      Then the record status is "Excused" on the detail page

    Scenario: Ensure that a response with status 6 shows "Disqualified"
      When I go directly to the "/response/123051234" page
      Then the record status is "Disqualified" on the detail page

    Scenario: Ensure that a response with status 7 shows "Deferred"
      When I go directly to the "/response/123061234" page
      Then the record status is "Deferred" on the detail page

    Scenario: Ensure that a response with status 8 shows "Reassign"
      When I go directly to the "/response/123071234" page
      Then the record status is "Reassign" on the detail page

    Scenario: Ensure that a response with status 9 shows "Undeliverable"
      When I go directly to the "/response/123081234" page
      Then the record status is "Undeliverable" on the detail page

    Scenario: Ensure that a response with status 10 shows "Transferred"
      When I go directly to the "/response/123091234" page
      Then the record status is "Transferred" on the detail page

    Scenario: Ensure that a response with status 11 shows "Awaiting Info"
      When I go directly to the "/response/123101234" page
      Then the record status is "Awaiting Info" on the detail page

    Scenario: Verify that a response for a deceased Juror shows highlight bars for only Juror details
      When I go directly to the "/response/352004504" page

      Then the Juror details tab is flagged as important
        And the Eligibility tab is not flagged as important
        And the Deferral or excusal tab is not flagged as important
        And the CJS Employee tab is not flagged as important
        And the Reasonable adjustment tab is not flagged as important

    Scenario: Verify that a response for a deceased Juror does not show Eligibility information
      When I go directly to the "/response/352004504" page

      Then I switch to the Eligibility tab
        And the juror eligibility for Residency has "N/A" on the detail page
        And the juror eligibility for Mental health has "N/A" on the detail page
        And the juror eligibility for Bail has "N/A" on the detail page
        And the juror eligibility for Convictions has "N/A" on the detail page

    Scenario: Verify that a response for a deceased Juror does not show Deferral or Excusal information
      When I go directly to the "/response/352004504" page

      Then I switch to the Deferral or excusal tab
        And the juror summons date has "N/A" on the detail page

    Scenario: Verify that a response for a deceased Juror does not show CJS Employment information
      When I go directly to the "/response/352004504" page

      Then I switch to the CJS Employee tab
        And the juror CJS Employment has "N/A" on the detail page

    Scenario: Verify that a response for a deceased Juror does not flag as ineligible, excusal or deferral
      When I go directly to the "/response/352004504" page

      Then the status flag is not "Ineligible"
        And the status flag is not "Excusal"
        And the status flag is not "Deferral"
        And the status flag is "Deceased"

    Scenario: Verify that a response for an excusal flags correct status
      When I go directly to the "/response/509092530" page

      Then the status flag is "Deferral"

    @JDB-1560 @bug
    Scenario: Turquoise bar not displayed when new DOB, Primary Phone, Secondary Phone or Email entered
      When I click the entry for juror number "309092530"

      # Juror details
      Then I switch to the Juror details tab
        And the Date of Birth field is marked as important
        And the Primary Phone field is marked as important
        And the Secondary Field field is marked as important
        And the Email field is marked as important


    @private-JDB-1774 @bug @ineligible
    Scenario: Age ineligible response does not show information that is not relevant to response
      When I click the entry for juror number "509092531"

      Then the Juror details tab is flagged as important
        And the Date of Birth field is marked as important

      Then the Eligibility tab is not flagged as important
        And the Deferral or excusal tab is not flagged as important
        And the CJS Employee tab is not flagged as important
        And the Reasonable adjustment tab is not flagged as important

    @JDB-1948 @bug
    Scenario: 'Other' reason displays instead of 'other'
      When I click the entry for juror number "301082530"

      Then I switch to the Juror details tab
        And the third party reason is "Holiday reason" on the detail page

    @JDB-2337 @bug
    Scenario: Reasonable adjustments do not repeat
      When I click the entry for juror number "309092530"

      Then I switch to the Reasonable adjustment tab
        And the juror Disability or impairement has "DIET" on the detail page
        And the juror Disability or impairement has "VISUAL IMPAIRMENT" on the detail page
        And the juror Reasonable adjustment is "Even more special reasons" on the detail page
