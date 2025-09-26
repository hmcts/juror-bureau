(function() {
  'use strict';

  const { bankHolidaysDAO } = require('../../objects/administration');

  module.exports.getBankHolidays = function(app) {
    return async function(req, res) {

      let bankHolDates = req.session.bankHolidayDates;

      if (!bankHolDates?.length){
        
        bankHolDates = [];

        try {
          const bankHolData = await bankHolidaysDAO.get(req);
          
          try{
            Object.keys(bankHolData).forEach(function (item, index) {
              for (let i = 0; i < bankHolData[item].length; i++) {
                let bankHolDate = new Date(bankHolData[item][i].date);
                let dateString = bankHolDate.getFullYear() + ('0' + (bankHolDate.getMonth()+1)).slice(-2) + ('0' + bankHolDate.getDate()).slice(-2);
                bankHolDates.push(dateString);
              }
            });
            req.session.bankHolidayDates = bankHolDates;
            app.logger.info('date-picker.controller parsed bank holiday data: ', JSON.stringify(bankHolDates));
          } catch(err){
            bankHolDates = [];
            app.logger.crit('Failed to parse bank holiday dates for datepicker: ', err)
          }

        } catch (err) {
          app.logger.crit('Failed to fetch bank holidays for datepicker', {
            auth: req.session.authentication,
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
        }
      }
      
      res.json(JSON.stringify(bankHolDates));

    };
  };



})();
