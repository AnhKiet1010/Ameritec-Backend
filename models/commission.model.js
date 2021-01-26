const mongoose = require('mongoose');
// user schema
const comSchema = new mongoose.Schema(
  {
    join_mem: {
        type: String
    },
    receive_mem: {
        type: String
    },
    status: {
        type: String,
        default: 'pending'
    },
    created_time: {
        type: String
    },
    amount: {
        type: String
    },
    payment_method: {
        type: String
    },
    active_admin: {
        type: String
    },
    qualified : {
        type: Boolean,
        default: false
    }
  }
);

module.exports = mongoose.model('Commission', comSchema);
