module.exports = {


  friendlyName: 'View fractal dashboard',


  description: 'Display "Fractal dashboard" page.',


  exits: {

    success: {
      viewTemplatePath: 'pages/concrete/fractal-dashboard'
    }

  },


  fn: async function () {

    // Respond with view.
    return {};

  }


};
