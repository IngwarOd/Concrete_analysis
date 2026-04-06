/**
 * Results.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    userId: {
      type: 'number',
      required: true
    },

    method: {
      type: 'string'
    },

    imgRoutes: {
      type: 'json'
    },

    results: {
      type: 'json'
    },

    archived: {
      type: 'boolean'
    }



  },

};

