const mongoose = require('mongoose');
// user schema
const adminSchema = new mongoose.Schema(
  {
    full_name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    role: {
        type: String,
        default: 'Admin'
    },
  }
);

module.exports = mongoose.model('Admin', adminSchema);