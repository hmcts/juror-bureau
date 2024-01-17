(function() {
  'use strict';

  const splitPostCode = require('./mod-utils').splitPostCode;

  describe('Test the postcode split', () => {

    it('should work with 2 chars (1 digit) and spaces', () => {
      const postCodePart = splitPostCode('A9 9AA');

      expect(postCodePart).to.equal('A9');
    });

    it('should work with 2 chars (1 digit) and no spaces', () => {
      const postCodePart = splitPostCode('A99AA');

      expect(postCodePart).to.equal('A9');
    });

    it('should work with 3 chars (1 digit) and spaces:', () => {
      const postCodePart = splitPostCode('AA9 9AA');

      expect(postCodePart).to.equal('AA9');
    });

    it('should work with 3 chars (1 digit) and no spaces:', () => {
      const postCodePart = splitPostCode('AA99AA');

      expect(postCodePart).to.equal('AA9');
    });

    it('should work with 3 chars (2 digits A99) and spaces', () => {
      const postCodePart = splitPostCode('A99 9AA');

      expect(postCodePart).to.equal('A99');
    });

    it('should work with 3 chars (2 digits A99) and no spaces', () => {
      const postCodePart = splitPostCode('A999AA');

      expect(postCodePart).to.equal('A99');
    });

    it('should work with 3 chars (2 digits A9A) and spaces', () => {
      const postCodePart = splitPostCode('A9A 9AA');

      expect(postCodePart).to.equal('A9A');
    });

    it('should work with 3 chars (2 digits A9A) and no spaces', () => {
      const postCodePart = splitPostCode('A9A9AA');

      expect(postCodePart).to.equal('A9A');
    });

    it('should work with 4 chars (1 digit) and spaces', () => {
      const postCodePart = splitPostCode('AA9A 9AA');

      expect(postCodePart).to.equal('AA9A');
    });

    it('should work with 4 chars (1 digit) and no spaces', () => {
      const postCodePart = splitPostCode('AA9A9AA');

      expect(postCodePart).to.equal('AA9A');
    });

    it('should work with 4 chars (2 digits) and spaces', () => {
      const postCodePart = splitPostCode('AA99 9AA');

      expect(postCodePart).to.equal('AA99');
    });

    it('should work with 4 chars (2 digits) and no spaces', () => {
      const postCodePart = splitPostCode('AA999AA');

      expect(postCodePart).to.equal('AA99');
    });

  });

})();
