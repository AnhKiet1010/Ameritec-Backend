const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.checkAdmin  = (req,res,next) => {
    const token = req.headers.authorization.split(' ')[1];

    if (token) {
        jwt.verify(
          token,
          process.env.JWT_SECRET,
          async (err, decoded) => {
            if (err) {
              console.log("token error");
              res.json({
                success: 401,
                message: "Phiên đăng nhập hết hạn hoặc không đúng",
                errors: [],
              });
            } else {
                const { _id } = jwt.decode(token);
                console.log('user id', _id);
                const user = await User.findOne({_id}).select('role').exec();
                if(user.role === 'admin') {
                    next();
                } else {
                  console.log("error here 1");
                  res.json({
                      status: 400,
                      message: "Bạn không được quyền thao tác này",
                      errors: []
                    });
                }
            }
        })
    } else {
      console.log("error here 2");
      res.json({
        status: 400,
        message: "Bạn không được quyền thao tác này",
        errors: [],
      });
    }
}

exports.checkAdminPost  = (req,res,next) => {
  const {token} = req.body;

  if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        async (err, decoded) => {
          if (err) {
            console.log("token error");
            res.json({
              success: false,
              errors: [
                {
                  label: "token_error",
                  err_message: "Phiên đăng nhập hết hạn hoặc không đúng",
                },
              ],
            });
          } else {
              const { _id } = jwt.decode(token);
              const user = await Admin.findOne({_id}).select('role').exec();

              if(user.role === 'admin') {
                  next()
              } else {
                  res.json({
                      success: false,
                      errors: [
                        {
                          label: "permission_error",
                          err_message: "Bạn không được quyền truy cập vào trang này",
                        },
                      ],
                    });
              }
          }
      })
  }
}