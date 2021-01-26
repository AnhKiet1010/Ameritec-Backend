const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.getInfo = async (req,res) => {
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
                const user = await User.findOne({_id}).select('full_name phone birthday complete_profile_level gender id_code id_type id_time issued_by tax_code iden_type').exec();
                
                res.json({user});
            }
        })
    }
}

exports.editInfo = async (req, res) => {
  const { values, _id } = req.body;
  const {
    full_name,phone,
    birthday,gender,
    id_code,id_time,
    issued_by,tax_code,
    password,
  } = values;

  const errors = [];

  const user = await User.findOne({_id}).exec();

  bcrypt.compare(password, user.hashed_password, async function (err, result) {
    // result == true
    if (!result || err) {
      errors.push({
        label: "password",
        err_message: "Mật khẩu không đúng. Vui lòng thử lại",
      });
      res.json({ success: false, errors });
    } else {
      const valid_phone = await User.findOne({ phone }).exec();
      const valid_id_code = await User.findOne({ id_code }).exec();
      const valid_tax_code = await User.findOne({ tax_code }).exec();

  if (valid_phone) {
    if(JSON.stringify(valid_phone) !== JSON.stringify(user)) {
      errors.push({
        label: "phone",
        err_message: "Số điện thoại đã được sử dụng.Vui lòng chọn số khác",
      });
    }
  }
  if (valid_id_code) {
    if(JSON.stringify(valid_id_code) !== JSON.stringify(user)) {
    errors.push({
      label: "id_code",
      err_message: "Số CMND/Hộ chiếu đã được sử dụng",
    });
  }
  }
  if (valid_tax_code) {
    if(JSON.stringify(valid_tax_code) !== JSON.stringify(user)) {
      errors.push({
        label: "tax_code",
        err_message: "Mã số thuế đã được sử dụng",
      });
    }
  }

  if (errors.length > 0) {
    res.json({ success: false, errors });
  } else {
    if(user.complete_profile_level !== 1) {
      await User.findOneAndUpdate({_id}, {
          full_name,phone,
          birthday,gender,
          id_code,id_time,
          issued_by,tax_code
        }).exec();
      res.json({ success: true, message: "Cập nhật thông tin thành công 🎉"});
    } else {  
      await User.findOneAndUpdate({_id}, {
        full_name,phone
      }).exec();
      res.json({ success: true, message: "Cập nhật thông tin thành công 🎉"});
    }
  }
    }
  });
}