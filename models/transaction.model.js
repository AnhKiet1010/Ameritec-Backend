const mongoose = require('mongoose');
// user schema
const tranSchema = new mongoose.Schema(
  {
    token: {
      type: String
    },
    status: {
      type: String,
      default: 'pending'
    },
    created_time: {
      type:  String
    },
    approved_by : {
      type: String,
      default: 'no have'
    },
    approved_time : {
      type: String
    },
    created_by: {
      type: String
    },
    email: {
      type: String
    },
    payment_method: {
      type: String,
      default: ''
    },
    phone: {
      type: String
    },
    buy_package: {
      type: String
    },
    expired_time: {
      type: String
    },
    orderId: {
      type: String
    },
    amount: {
      type: String
    }
  }
);

module.exports = mongoose.model('Transaction', tranSchema);
