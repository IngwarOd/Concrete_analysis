// api/controllers/concrete/view-fractal-dashboard.js
module.exports = {

  friendlyName: 'View fractal dashboard',

  description: 'Display fractal dashboard page.',

  exits: {
    success: {
      viewTemplatePath: 'pages/concrete/fractal-dashboard'
    }
  },

  fn: async function () {
    return {
      pageTitle: 'Fractal dashboard'
    };
  }

};
