module.exports = {

  friendlyName: 'View users',

  description: 'Display all users.',

  exits: {
    success: {
      viewTemplatePath: 'pages/users'
    }
  },

  fn: async function (inputs, exits) {

    let users = await User.find();

    return exits.success({
      users
    });
  }
};
