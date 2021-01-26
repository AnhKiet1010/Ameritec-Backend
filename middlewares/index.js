const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

exports.checkAdmin  = (req,res,next) => {
    const {token} = req.query;

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
                            err_message: "Bạn không được quyền thao tác này",
                          },
                        ],
                      });
                }
            }
        })
    } else {
      res.json({
        success: false,
        errors: [
          {
            label: "permission_error",
            err_message: "Bạn không được quyền thao tác này",
          },
        ],
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