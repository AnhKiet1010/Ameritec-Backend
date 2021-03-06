const mongoose = require('mongoose');
// user schema
const activation = new mongoose.Schema(
  {
    linkId: {
        type: String
    },
    accountId: {
        type: String
    },
    groupId: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    activationLimit: {
        type: String
    },
    activationCount: {
        type: String
    },
    licenseJwt: {
        type: String
    },
    shortToken: {
        type: String
    },
    created: {
        type: String
    },
    modified: {
        type: String
    },
  }
);

module.exports = mongoose.model('Activation', activation);