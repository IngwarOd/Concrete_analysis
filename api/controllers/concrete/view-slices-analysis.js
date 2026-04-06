// api/controllers/concrete/view-slices-analysis.js
module.exports = {

  friendlyName: 'View slices analysis',

  description: 'Display slices analysis page.',

  exits: {
    success: {
      viewTemplatePath: 'pages/concrete/slices-analysis'
    }
  },

  fn: async function () {
    return {
      pageTitle: 'Slices analysis'
    };
  }

};
