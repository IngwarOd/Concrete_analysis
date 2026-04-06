module.exports = {

  friendlyName: 'View profile',

  description: 'Display user profile.',

  exits: {
    success: {
      viewTemplatePath: 'pages/profile'
    }
  },

  fn: async function (inputs, exits) {
    return exits.success({
      user: this.req.me
    });
  }
};
