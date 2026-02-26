(() => {
  "use strict";

  const { validate } = require("validate.js");
  const _ = require("lodash");
  const { dateFilter } = require("../../../components/filters/index.js");
  const { erDeadlineDAO } = require("../../../objects/electoral-register.js");
  const validator = require("../../../config/validation/electoral-register.js");

  module.exports.getChangeDeadline = (app) => (req, res) => {
    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);
    delete req.session.errors;
    delete req.session.formFields;

    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return res.render("electoral-register/set-deadline", {
      pageTitle: "Set deadline",
      postUrl: app.namedRoutes.build("electoral-register.set-deadline.post"),
      minDate: dateFilter(tomorrow, null, "DD/MM/YYYY"),
      cancelUrl: app.namedRoutes.build("electoral-register.get"),
      tmpBody,
      errors: {
        title: "Please check the form",
        count:
          typeof tmpErrors !== "undefined" ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

})();
