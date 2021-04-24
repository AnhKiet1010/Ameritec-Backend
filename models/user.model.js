const mongoose = require('mongoose');

// user schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true
    },
    full_name: {
      type: String
    },
    id_ameritecjsc: {
      type: String
    },
    user_registered: {
      type: String
    },
    user_login: {
      type: String
    },
    password: {
      type: String,
      required: true
    },
    gender: {
      type: Number,
    },
    birthday: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: 'normal'
    },
    resetPasswordLink: {
      data: String,
      default: ''
    },
    amount: {
      type: Number,
      default: 0
    },
    point: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 0
    },
    avatar: {
      type: String,
      default: 'https://robohash.org/maximeteneturdignissimos.jpg?size=100x100&set=set1'
    },
    buy_package: {
      type: String,
    },
    id_code: {
      type: String,
    },
    id_time: {
      type: String
    },
    issued_by: {
      type: String
    },
    bank: {
      type: String
    },
    bank_account: {
      type: Number
    },
    bank_name: {
      type: String
    },
    idenMT: {
      type: String
    },
    idenMS: {
      type: String
    },
    tax_code: {
      type: String
    },
    created_time: {
      type: String
    },
    child1: {
      type: Object,
      default: {
        arr: [],
        countChild: 0
      },
    },
    child2: {
      type: Object,
      default: {
        arr: [],
        countChild: 0
      },
    },
    child3: {
      type: Object,
      default: {
        arr: [],
        countChild: 0
      },
    },
    groupNumber: {
      type: String
    },
    countChild: {
      type: Number,
      default: 0,
    },
    parentId: {
      type: String
    },
    be_member: {
      type: Boolean
    },
    expired: {
      type: Boolean
    }
  }
);

module.exports = mongoose.model('User', userSchema);
