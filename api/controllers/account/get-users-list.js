module.exports = {


  friendlyName: 'Get users list',


  description: '',


  inputs: {

  },


  exits: {
    success: {

    }

  },


  fn: async function (_, exits) {

    let usersList = await User.find();

    console.log('usersList', usersList)
    // All done.
    return exits.success(usersList);

  }


};
