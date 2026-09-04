(function() {
  'use strict';

  const { removeAgeDisqualifiedJurorsFromMovementData } = require('./age-disqualification-functions');

  describe('Age disqualification functions:', function() {

    it('should move only jurors unavailable due to maximum age into the available list', function() {
      const movementData = {
        availableForMove: ['100000001'],
        unavailableForMove: [
          {
            jurorNumber: '100000002',
            failureReason: 'Juror would exceed maximum age on the new date',
          },
          {
            jurorNumber: '100000003',
            failureReason: 'Juror is unavailable for another reason',
          },
        ],
      };

      removeAgeDisqualifiedJurorsFromMovementData(movementData);

      expect(movementData).to.deep.equal({
        availableForMove: ['100000001', '100000002'],
        unavailableForMove: [
          {
            jurorNumber: '100000003',
            failureReason: 'Juror is unavailable for another reason',
          },
        ],
      });
    });

  });
})();
