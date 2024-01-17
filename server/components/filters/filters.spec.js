(function() {
  'use strict';

  var filter = require('./index');

  describe('Custom macros and filters', function() {

    it('should capitalise every word of a sentence', function() {
      var sentence = 'SENTENCE TO CAPITALISE FULLY'
        , expected = 'Sentence To Capitalise Fully'
        , output;

      output = filter.capitalizeFully(sentence);

      expect(output).to.be.equal(expected);

      output = filter.capitalizeFully();
      expect(output).to.be.undefined;
    });

    it('should capitalise every word of a sentence - unhappy path', function() {
      var sentence = ''
        , output;

      output = filter.capitalizeFully(sentence);

      expect(output).to.be.undefined;
    });

    it('should transform the pool type from a 3 letter tag to a full word', function() {
      var poolTypes = ['CRO', 'COR', 'CIV', 'HGH']
        , expected = ['Crown court', 'Coroner’s court', 'Civil court', 'High court']
        , output;

      output = filter.transformPoolType(poolTypes[0]);
      expect(output).to.be.equal(expected[0]);

      output = filter.transformPoolType(poolTypes[1]);
      expect(output).to.be.equal(expected[1]);

      output = filter.transformPoolType(poolTypes[2]);
      expect(output).to.be.equal(expected[2]);

      output = filter.transformPoolType(poolTypes[3]);
      expect(output).to.be.equal(expected[3]);
    });

    it('should build a juror record address from multiple lines', function() {
      var address = [
          '123 STREET NAME',
          'ANOTHER LINE',
          'THE TOWN',
          'GREATER CITY',
          'PO57 C0D3'
        ]
        , expected = '123 STREET NAME<br> ANOTHER LINE<br> THE TOWN<br> GREATER CITY<br> PO57 C0D3'
        , output;

      output = filter.buildRecordAddress(address);

      expect(output).to.be.equal(expected);
    });

    it('should build a juror record address from multiple lines with null lines', function() {
      var address = [
          '123 STREET NAME',
          null,
          null,
          'GREATER CITY',
          'PO57 C0D3'
        ]
        , expected = '123 STREET NAME<br> GREATER CITY<br> PO57 C0D3'
        , output;

      output = filter.buildRecordAddress(address);

      expect(output).to.be.equal(expected);
    });

    it('should build a juror record address from multiple lines with null lines and capitalized properly', function() {
      var address = [
          '123 STREET NAME',
          null,
          null,
          'GREATER CITY',
          'PO57 C0D3'
        ]
        , expected = '123 Street Name<br> Greater City<br> Po57 C0d3'
        , output;

      output = filter.capitalizeFully(filter.buildRecordAddress(address));

      expect(output).to.be.equal(expected);
    });

    it('should make a date from an array', function() {
      var dateArr = [2023, 1, 1]
        , output;

      output = filter.makeDate(dateArr);

      expect(output.toISOString()).to.be.equal('2023-01-01T00:00:00.000Z');
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

      expect(output1).to.be.equal(today);
      expect(output2).to.be.equal(today);
      expect(output3).to.be.equal(today);
      expect(output4).to.be.equal(today);
    });

    it('should stringify an object', function() {
      var obj = {
          foo: 'bar',
        }
        , str = '{"foo":"bar"}'
        , output;

      output = filter.console(obj);

      expect(output).to.be.equal(str);
    });

    it('should show System if a response was auto processed', function() {
      var output;

      output = filter.isAutoProcessed('AUTO');
      expect(output).to.be.equal('System');

      output = filter.isAutoProcessed('Fname Lname');
      expect(output).to.be.equal('Fname Lname');

      output = filter.isAutoProcessed('');
      expect(output).to.be.equal('System');

      output = filter.isAutoProcessed();
      expect(output).to.be.equal('System');
    });

  });

})();
