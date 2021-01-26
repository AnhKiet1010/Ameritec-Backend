const mongoose = require('mongoose');
// user schema
const exSchema = new mongoose.Schema(
  {
    parent: {
        type: String
    },
    created_time: {
        type: String
    },
    expired_time: {
        type: String
    },
    amount: {
        type: String
    },
    payment_method: {
        type: String
    }
  }
);

module.exports = mongoose.model('Extension', exSchema);
