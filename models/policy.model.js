const mongoose = require('mongoose');
// user schema
const policySchema = new mongoose.Schema(
  {
    text: {
      type: String
    }
  }
);

module.exports = mongoose.model('Policy', policySchema);
