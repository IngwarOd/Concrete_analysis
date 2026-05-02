module.exports = {


  friendlyName: 'View report history',


  description: 'Display "Report history" page.',


  exits: {

    success: {
      viewTemplatePath: 'pages/concrete/report-history'
    }

  },


  fn: async function () {

    // Respond with view.
    return {};

  }


};
