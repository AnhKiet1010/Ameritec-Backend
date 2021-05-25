const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.checkAdmin = async (req, res, next) => {
  const headersToken = req.get('authorization');
  const token = headersToken.split(' ')[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    async (err, decoded) => {
      if (err) {
        return res.json({
          status: 401,
          message: "Phiên đăng nhập đã hết hạn.Vui lòng đăng nhập lại!",
          errors: [],
        });
      } else {
        const { _id } = jwt.decode(token);

        const user = await User.findOne({_id}).exec();
        if(user.role !== 'admin') {
          return res.json({
            status: 403,
            message: "Not permission",
            errors: [],
          })
        }
        next();
      }
    });
}

exports.checkClient = async (req, res, next) => {
  const headersToken = req.get('authorization');
  const token = headersToken.split(' ')[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    async (err, decoded) => {
      if (err) {
        return res.json({
          status: 401,
          message: "Phiên đăng nhập đã hết hạn.Vui lòng đăng nhập lại!",
          errors: [],
        });
      } else {
        const { _id } = jwt.decode(token);

        const user = await User.findOne({_id}).exec();
        if(user.role !== 'normal') {
          return res.json({
            status: 403,
            message: "Not permission",
            errors: [],
          })
        }
        next();
      }
    });
}

