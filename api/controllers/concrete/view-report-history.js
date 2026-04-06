// api/controllers/concrete/view-report-history.js
module.exports = {

  friendlyName: 'View report history',

  description: 'Display report history page.',

  exits: {
    success: {
      viewTemplatePath: 'pages/concrete/report-history'
    }
  },

  fn: async function () {
    return {
      pageTitle: 'Report history'
    };
  }

};
