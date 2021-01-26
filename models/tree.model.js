const mongoose = require('mongoose');
// user schema
const treeSchema = new mongoose.Schema(
  {
    parent: {
      type: String
    },
    group1: {
      type: Array
    },
    group2: {
      type:  Array
    },
    group3: {
      type: Array
    },
    buy_package: {
      type: String
    }
  }
);

module.exports = mongoose.model('Tree', treeSchema);
