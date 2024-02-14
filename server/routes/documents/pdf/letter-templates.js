/* eslint-disable max-len */
(function() {
  'use strict';

  const templates = {
    'en': {
      'postponement': (data) => {
        return 'Circumstances have arisen which make it unnecessary for you to attend for jury service on the day given on your summons. Accordingly, your jury service has been postponed to a later date.\n\n'
          + 'You are now required to attend on:\n\n'
          + `${data.serviceDate} at ${data.serviceTime}.\n\n`
          + 'Please accept our apologies for any inconvenience this postponement of your jury service may cause. If you are unable to attend on the new date given above, please contact this court as soon as possible.\n\n'
          + 'Yours sincerely,';
      },

      'withdrawal': () => {
        return 'Thank you for replying to your jury summons.\n\n'
          + 'This letter is to confirm that, as you are not qualified for jury service, the summons has been withdrawn.\n\n'
          + 'Accordingly, you need not attend Court or take any further action.\n\n'
          + 'Yours sincerely,';
      },

      'deferral-granted': (data) => {
        return 'Thank you for replying to your jury summons.\n\n'
          + 'This letter is to confirm that your Jury Service has been deferred on this occasion.\n\n'
          + 'You are now required to attend on:\n\n'
          + `${data.serviceDate}, at ${data.serviceTime}.\n\n`
          + 'Your jury service cannot be deferred a second time. You must therefore attend Court on the above date, unless you subsequently apply for and are granted excusal from jury service or are released from service prior to that date.\n\n'
          + 'Yours sincerely,';
      },

      'deferral-refused': (data) => {
        return 'Thank you for replying to your jury summons.\n\n'
          + 'Your application to have your jury service deferred has been refused.\n'
          + 'Accordingly, you must attend Court on the date and time given in your summons.\n\n'
          + 'You are entitled to appeal against this decision. To do so, you should write to the Court setting out the reasons why you wish your jury service to be deferred.\n\n'
          + 'Please write to:\n\n'
          + `${data.courtAddress}\n\n`
          + 'A judge of the Crown Court may hear your appeal. If this happens, the appeal will be heard before you are due to attend for jury service. You will be notified in advance, of the date, time and location of the hearing and you will be given the opportunity to attend and make representations to the judge. If you do not attend, the appeal will be decided on the basis of your written representations.\n\n'
          + 'Unless you are subsequently notified that your jury service has been deferred, you must attend the Court on the date shown on your summons.\n\n'
          + 'Yours sincerely,';
      },

      'excusal-granted': () => {
        return 'Thank you for replying to your jury summons.'
          + 'This letter is to confirm that you have been excused from jury service on this occasion. Accordingly, you need not attend court or take any further action.\n\n'
          + 'Yours sincerely,';
      },

      'excusal-refused': (data) => {
        return 'Thank you for replying to your jury summons.\n\n'
          + 'Your application to be excused from jury service has been refused.\n'
          + 'Accordingly, you must attend Court on the date and time given in your summons.\n\n'
          + 'You are entitled to appeal against this decision. To do so, you should write to the Court setting out the reasons why you wish your jury service to be excused.\n\n'
          + 'Please write to:\n\n'
          + `${data.courtAddress}\n\n`
          + 'A judge of the Crown Court may hear your appeal. If this happens, the appeal will be heard before you are due to attend for jury service. You will be notified, in advance, of the date, time and location of the hearing and you will be given the opportunity to attend and make representations to the judge. If you do not attend, the appeal will be decided on the basis of your written representations.\n\n'
          + 'Unless you are notified that you have been excused, you must attend the Court on the date shown on your summons.\n\n'
          + 'Yours sincerely,';
      },
    },
    'cy': {
      'postponement': (data) => {
        return `Mae amgylchiadau wedi codi sy'n golygu nad oes raid i chi ddod i wasanaethu ar reithgor ar y diwrnod a nodwyd ar eich gw§s. Bellach, gofynnir i chi ddod ar ${data.serviceDate} am ${data.serviceTime}.\n\n`
          + 'Mae\'n ddrwg iawn gennyf am unrhyw anhwylustod i chi oherwydd y gohirio hwn.\n\n'
          + 'Yn gywir';
      },

      'withdrawal': () => {
        return 'Diolch i chi am ymateb i\'r w§s rheithgor.\n\n'
          + 'Gan nad ydych yn gymwys i wasanaethu ar reithgor, rwyf wedi tynnu\'r w§s yn ôl. Does dim angen i chi ddod i\'r llys na chymryd camau pellach.\n\n'
          + 'Yn gywir,';
      },

      'deferral-granted': (data) => {
        return `Diolch i chi am ymateb i'ch gw§s rheithgor. Gallaf ohirio'ch gwasanaeth rheithgor am y tro. Bellach, disgwylir i chi fod yn bresennol ar ${data.serviceDate} am ${data.serviceTime} ac ar unrhyw ddiwrnodau pellach sy'n ofynnol gan y Llys.\n\n`
          + 'Ni ellir gohirio\'ch gwasanaeth am yr ail dro. Rhaid i chi ddod yno ar y diwrnod a nodir uchod:\n\n'
          + 'oni bai eich bod chi\'n gwneud cais am gael eich esgusodi a bod hynny\'n cael ei ganiatáu neu os bydd y Llys yn eich rhyddhau rhag gorfod gwasanaethu ar reithgor.\n\n'
          + 'Yn gywir';
      },

      'deferral-refused': (data) => {
        return 'Diolch i chi am ymateb i\'ch gw§s rheithgor. Ni allaf ohirio eich cyfnod gwasanaeth fel rheithiwr. Rhaid i chi ddod ar y dyddiad a\'r amser i\'r lle a nodir yn eich gw§s.\n\n'
          + 'Fodd bynnag, cewch apelio i\'r Llys yn erbyn y penderfyniad hwn. I wneud hynny, ysgrifennwch at y Llys yn dweud pam yr hoffech chi gael eich esgusodi rhag gwasanaethu ar reithgor.\n\n'
          + 'Ysgrifennwch at\n\n'
          + `${data.courtAddress}\n\n`
          + 'Os bydd Barnwr Llys y Goron yn gwrando ar eich apêl, fe\'i gwrandewir cyn y dyddiad pan ddylech ddod i\'r llys fel rheithiwr. Cewch wybod ymlaen llaw, ar ba ddyddiad ac am faint o\'r gloch y cynhelir y gwrandawiad. Cewch ddod yno a rhoi eich rhesymau i\'r Barnwr os dymunwch. Os na fyddwch chi\'n dod yno, penderfynir yr apêl ar sail datganiad ysgrifenedig.\n\n'
          + 'Os na fyddwch chi\'n clywed fod eich gwasanaeth rheithgor wedi ei ohirio, rhaid i chi ddod i\'r Llys ar y dyddiad a ddangosir ar eich gw§s.\n\n'
          + 'Yn gywir';
      },

      'excusal-granted': () => {
        return 'Diolch i chi am ymateb i\'ch gw§s rheithgor. Gallaf eich esgusodi chi rhag gorfod gwasanaethu ar reithgor y tro hwn.\n\n'
          + 'Nid oes angen i chi ddod i\'r llys na chymryd camau pellach.\n\n'
          + 'Yn gywir';
      },

      'excusal-refused': (data) => {
        return 'Diolch i chi am ymateb i\'ch gw§s rheithgor. Ni allaf eich esgusodi rhag gwasanaethu ar reithgor. Rhaid i chi ddod ar y dyddiad a\'r amser i\'r lle a nodir yn eich gw§s.\n\n'
          + 'Fodd bynnag, cewch apelio i\'r Llys yn erbyn y penderfyniad hwn. I wneud hynny, ysgrifennwch at y Llys yn dweud pam yr hoffech chi gael eich esgusodi rhag gwasanaethu ar reithgor.\n\n'
          + 'Ysgrifennwch at\n\n'
          + `${data.courtAddress}\n\n`
          + 'Os bydd Barnwr Llys y Goron yn gwrando ar eich apêl, fe\'i gwrandewir cyn y dyddiad pan ddylech ddod i\'r llys fel rheithiwr. Cewch wybod ymlaen llaw, ar ba ddyddiad ac am faint o\'r gloch y cynhelir y gwrandawiad. Cewch ddod yno a rhoi eich rhesymau i\'r Barnwr os dymunwch. Os na fyddwch chi\'n dod yno, penderfynir yr apêl ar sail eich datganiad ysgrifenedig.\n\n'
          + 'Os na fyddwch chi\'n clywed eich bod wedi cael eich esgusodi, rhaid i chi ddod i\'r Llys ar y dyddiad a ddangosir ar eich gw§s.\n\n'
          + 'Yn gywir';
      },
    },
  };

  module.exports = function(letterType, data = {}) {
    if (data.welsh) {
      return templates['cy'][letterType](data);
    }

    return templates['en'][letterType](data);
  };

})();
