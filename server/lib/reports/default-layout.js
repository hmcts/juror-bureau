(function() {
  'use strict';

  module.exports = function(pageOrientation = 'portrait') {
    return {
      fonts: {
        OpenSans: {
          normal: './client/assets/fonts/OpenSans-Regular.ttf',
          bold: './client/assets/fonts/OpenSans-Bold.ttf',
        },
      },
      logo: './client/assets/images/hmcts-logo.png',
      defaultStyles: {
        pageSize: 'A4',
        pageOrientation: pageOrientation,
        pageMargins: [20, 50, 20, 40],
        defaultStyle: {
          font: 'OpenSans',
        },
      },
      defaultLayout: {
        hLineWidth: (i) => (i !== 0) ? 1 : 0,
        hLineColor: '#b1b4b6',
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      otherStyles: {
        header: {
          fontSize: 16,
          bold: true,
          marginLeft: 20,
          marginTop: 10,
        },
        title: {
          fontSize: 26,
          bold: true,
        },
        footer: {
          fontSize: 10,
        },
        label: {
          bold: true,
        },
        body: {
          fontSize: 7,
        },
      },
    };
  };

})();
