(function() {
  'use strict';

  var filter = require('./index');

  describe('Custom macros and filters', function() {

    it('should capitalise every word of a sentence', function() {
      var sentence = 'SENTENCE TO CAPITALISE FULLY'
        , expected = 'Sentence To Capitalise Fully'
        , output;

      output = filter.capitalizeFully(sentence);

      expect(output).toEqual(expected);

      output = filter.capitalizeFully();
      expect(output).toBeUndefined();
    });

    it('should capitalise every word of a sentence - unhappy path', function() {
      var sentence = ''
        , output;

      output = filter.capitalizeFully(sentence);

      expect(output).toBeUndefined();
    });

    it('should transform the pool type from a 3 letter tag to a full word', function() {
      var poolTypes = ['CRO', 'COR', 'CIV', 'HGH']
        , expected = ['Crown court', 'Coroner’s court', 'Civil court', 'High court']
        , output;

      output = filter.transformPoolType(poolTypes[0]);
      expect(output).toEqual(expected[0]);

      output = filter.transformPoolType(poolTypes[1]);
      expect(output).toEqual(expected[1]);

      output = filter.transformPoolType(poolTypes[2]);
      expect(output).toEqual(expected[2]);

      output = filter.transformPoolType(poolTypes[3]);
      expect(output).toEqual(expected[3]);
    });

    it('should build a juror record address from multiple lines', function() {
      var address = [
          '123 STREET NAME',
          'ANOTHER LINE',
          'THE TOWN',
          'GREATER CITY',
          'PO57 C0D3',
        ]
        , expected = '123 STREET NAME<br> ANOTHER LINE<br> THE TOWN<br> GREATER CITY<br> PO57 C0D3'
        , output;

      output = filter.buildRecordAddress(address);

      expect(output).toEqual(expected);
    });

    it('should build a juror record address from multiple lines with null lines', function() {
      var address = [
          '123 STREET NAME',
          null,
          null,
          'GREATER CITY',
          'PO57 C0D3',
        ]
        , expected = '123 STREET NAME<br> GREATER CITY<br> PO57 C0D3'
        , output;

      output = filter.buildRecordAddress(address);

      expect(output).toEqual(expected);
    });

    it('should build a juror record address from multiple lines with null lines and capitalized properly', function() {
      var address = [
          '123 STREET NAME',
          null,
          null,
          'GREATER CITY',
          'PO57 C0D3',
        ]
        , expected = '123 Street Name<br> Greater City<br> Po57 C0d3'
        , output;

      output = filter.capitalizeFully(filter.buildRecordAddress(address));

      expect(output).toEqual(expected);
    });

    it('should make a date from an array', function() {
      var dateArr = [2023, 1, 1]
        , output;

      output = filter.makeDate(dateArr);

      expect(output.toISOString()).toEqual('2023-01-01T00:00:00.000Z');
    });

    it('should make a new date if an invalid date or no date is passed in', function() {
      var dateArr = []
        , dateStr = '//'
        , dateStr2 = ''
        , dateInvalid
        , output1
        , output2
        , output3
        , output4
        , today = new Date().toDateString();

      output1 = filter.makeDate(dateArr).toDateString();
      output2 = filter.makeDate(dateStr).toDateString();
      output3 = filter.makeDate(dateStr2).toDateString();
      output4 = filter.makeDate(dateInvalid).toDateString();

      expect(output1).toEqual(today);
      expect(output2).toEqual(today);
      expect(output3).toEqual(today);
      expect(output4).toEqual(today);
    });

    it('should stringify an object', function() {
      var obj = {
          foo: 'bar',
        }
        , str = '{"foo":"bar"}'
        , output;

      output = filter.console(obj);

      expect(output).toEqual(str);
    });

    it('should show System if a response was auto processed', function() {
      var output;

      output = filter.isAutoProcessed('AUTO');
      expect(output).toEqual('System');

      output = filter.isAutoProcessed('Fname Lname');
      expect(output).toEqual('Fname Lname');

      output = filter.isAutoProcessed('');
      expect(output).toEqual('System');

      output = filter.isAutoProcessed();
      expect(output).toEqual('System');
    });

    it('should build a grammatically correct string output for a list - 1 item',
      () => {
        let input = ['item1'],
          expected = 'item1',
          output = filter.prettyList(input);

        expect(output).toEqual(expected);
      }
    );

    it('should build a grammatically correct string output for a list - 2 items',
      () => {
        let input = ['item1', 'item2'],
          expected = 'item1 and item2',
          output = filter.prettyList(input);

        expect(output).toEqual(expected);
      }
    );

    it('should build a grammatically correct string output for a list - 3 or more items',
      () => {
        let input = ['item1', 'item2', 'item3'],
          expected = 'item1, item2 and item3',
          output = filter.prettyList(input);

        expect(output).toEqual(expected);
      }
    );

    it('should convert a string to camel case', function() {
      let string = 'String To Camel Case';
      const expected = 'stringToCamelCase';
      let output;

      output = filter.toCamelCase(string);
      expect(output).toEqual(expected);

      string = '--string-to-camel-case-';

      output = filter.toCamelCase(string);
      expect(output).toEqual(expected);

      string = '__STRING_TO_CAMEL_CASE__';

      output = filter.toCamelCase(string);
      expect(output).toEqual(expected);

      output = filter.toCamelCase();
      expect(output).toEqual('');
    });

    it('should convert a string to kebab case', function() {
      let string = 'String To Kebab Case';
      const expected = 'string-to-kebab-case';
      let output;

      output = filter.toKebabCase(string);
      expect(output).toEqual(expected);

      string = '--string-to-kebab-case-';

      output = filter.toKebabCase(string);
      expect(output).toEqual(expected);

      string = '__STRING_TO_KEBAB_CASE__';

      output = filter.toKebabCase(string);
      expect(output).toEqual(expected);

      output = filter.toKebabCase();
      expect(output).toEqual('');
    });

    it('should convert a string to sentence case', function() {
      let string = 'String To Sentence Case';
      const expected = 'String to sentence case';
      let output;

      output = filter.toSentenceCase(string);
      expect(output).toEqual(expected);

      string = '--string-to-sentence-case-';

      output = filter.toSentenceCase(string);
      expect(output).toEqual(expected);

      string = '__STRING_TO_SENTENCE_CASE__';

      output = filter.toSentenceCase(string);
      expect(output).toEqual(expected);

      output = filter.toSentenceCase();
      expect(output).toEqual('');
    });

    it('should add hyphens to a sort code', function() {
      let string = '123456';
      const expected = '12-34-56';

      const output = filter.sortCode(string);

      expect(output).toEqual(expected);
    });

    it('should convert a time string to hours and minutes', function() {
      let string;
      let expected;
      let output;

      string = '01:45';
      expected = '1 hour 45 minutes';
      output = filter.hoursStringToHoursAndMinutes(string);
      expect(output).toEqual(expected);

      string = '00:45';
      expected = '45 minutes';
      output = filter.hoursStringToHoursAndMinutes(string);
      expect(output).toEqual(expected);

      string = '01:00';
      expected = '1 hour ';
      output = filter.hoursStringToHoursAndMinutes(string);
      expect(output).toEqual(expected);

      string = '02:01';
      expected = '2 hours 1 minute';
      output = filter.hoursStringToHoursAndMinutes(string);
      expect(output).toEqual(expected);
    });

    it('should return true if an arry includes a value', function() {
      const arr = ['a', 'b', 'c'];
      const val = 'b';

      let output = filter.arrayIncludes(arr, val);

      expect(output).toEqual(true);
    });

    it('should return false if an arry does not include a value', function() {
      const arr = ['a', 'b', 'c'];
      const val = 'e';

      let output = filter.arrayIncludes(arr, val);

      expect(output).toEqual(false);
    });

  });

})();
