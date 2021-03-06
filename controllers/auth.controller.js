const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Tree = require("../models/tree.model");
const Commission = require("../models/commission.model");
const { updateParent, returnActiveAppMail, thankMail } = require("./method");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.MAIL_KEY);

const saltRounds = 10;

exports.checkLinkController = async (req, res) => {
  const { invite_code, donate_sales_id, group } = req.body;
  console.log(typeof group);

  if (
    invite_code.split("").length !== 24 ||
    donate_sales_id.split("").length !== 24
  ) {
    res.json({
      status: 400,
      message: "Link giới thiệu không đúng",
      errors: [],
    });
  } else if (parseInt(group) <= 0 || parseInt(group) > 3) {
    res.json({
      status: 400,
      message: "Link giới thiệu không đúng group",
      errors: [],
    });
  } else {
    const invalid_invite_code = await User.findById(invite_code).exec();
    const invalid_donate_sales_id = await User.findById(donate_sales_id).exec();

    if (!invalid_invite_code || !invalid_donate_sales_id) {
      res.json({
        status: 400,
        message: "Link giới thiệu không đúng",
        errors: [],
      });
    } else {
      res.json({
        status: 200,
        message: "Link giới thiệu đúng",
        errors: [],
      });
    }
  }
};

exports.registerController = async (req, res) => {
  const {
    full_name,
    email,
    password,
    phone,
    id_code,
    be_member,
    issued_by,
    bank_account,
    bank_name,
    iden_type,
    tax_code,
    birthday,
    gender,
    invite_code,
    donate_sales_id,
    groupNumber,
    buy_package,
    id_time,
  } = req.body;

  const user_repeat_email = await User.findOne({ email }).exec();
  const valid_phone = await User.findOne({ phone }).exec();

  await Transaction.deleteMany({ email, status: "pending" }).exec();

  const errors = [];

  if (user_repeat_email) {
    errors.push({ label: "email", err_message: "Email này đã được sử dụng" });
  }

  if (valid_phone) {
    errors.push({
      label: "phone",
      err_message: "Số điện thoại đã được sử dụng.Vui lòng chọn số khác",
    });
  }

  if (be_member) {
    const user_repeat_id_code = await User.findOne({ id_code }).exec();
    const user_repeat_bank_account = await User.findOne({
      bank_account,
    }).exec();
    const user_repeat_tax_code = await User.findOne({ tax_code }).exec();

    if (user_repeat_id_code) {
      errors.push({
        label: "id_code",
        err_message: "Số CMND đã được sử dụng",
      });
    }
    if (user_repeat_bank_account) {
      errors.push({
        label: "bank_account",
        err_message: "Số Tài Khoản này đã được sử dụng",
      });
    }
    if (user_repeat_tax_code) {
      errors.push({
        label: "tax_code",
        err_message: "Mã Số Thuế này đã được sử dụng",
      });
    }
  }

  if (errors.length > 0) {
    res.json({
      status: 401,
      errors,
      message: "Thông tin bị trùng! Xin vui lòng điền lại",
    });
  } else {
    const token = jwt.sign(
      {
        full_name,
        email,
        password,
        phone,
        id_code,
        be_member,
        issued_by,
        bank_account,
        bank_name,
        iden_type,
        tax_code,
        birthday,
        gender,
        invite_code,
        donate_sales_id,
        groupNumber,
        buy_package,
        id_time,
      },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "15m" }
    );

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const newTransaction = new Transaction({
      status: "pending",
      payment_method: "",
      token,
      created_time: new Date(),
      created_by: full_name,
      email,
      phone,
      expired_time: oneYearFromNow,
      buy_package,
    });

    await newTransaction.save(function (err) {
      if (err) {
        console.log("fail to save transaction!");
        res.json({
          status: 200,
          message: "fail to save transaction!",
          errors: [
            {
              label: "transaction",
              err_message: "Lỗi khi tạo giao dịch.Vui lòng thử lại sau",
            },
          ],
        });
      } else {
        console.log("save transaction done!");
        res.json({
          status: 200,
          message: "",
          data: { email, full_name, phone },
          errors,
        });
      }
    });
  }
};

exports.activationController = async (req, res) => {
  const { token } = req.body;

  if (token) {
    const transaction = Transaction.findOne({token}).exec();

    if(!transaction) {
      console.log("Activation error 1");
      res.json({
        status: 401,
        message: "Đường dẫn đã hết hạn.Vui lòng đăng ký lại",
        errors: [],
      });
    } else {
      jwt.verify(
        token,
        process.env.JWT_ACCOUNT_ACTIVATION,
        async (err, decoded) => {
          if (err) {
            console.log("Activation error 2");
            res.json({
              status: 401,
              message: "Đường dẫn đã hết hạn.Vui lòng đăng ký lại",
              errors: [],
            });
          } else {
            const {
              full_name,
              email,
              password,
              phone,
              id_code,
              be_member,
              issued_by,
              bank_account,
              bank_name,
              iden_type,
              tax_code,
              birthday,
              gender,
              invite_code,
              donate_sales_id,
              groupNumber,
              buy_package,
              id_time,
            } = jwt.decode(token);
  
            bcrypt.genSalt(saltRounds, function (err, salt) {
              bcrypt.hash(password, salt, async function (err, hash) {
                if (err) {
                  console.log(err);
                  return res.json(err);
                } else {
                  const userOfDonateSales = await User.findOne({
                    _id: donate_sales_id,
                  }).exec();
                  console.log("userOfDonateSales", userOfDonateSales);
                  const userOfInvite = await User.findOne({
                    _id: invite_code,
                  }).exec();
                  console.log("userOfInvite", userOfInvite);
  
                  const listAva = [
                    "similiquealiasoccaecati",
                    "molestiaeimpeditdolor",
                    "voluptatesabinventore",
                    "quinemoitaque",
                    "ametenimomnis",
                    "aliquamprovidenthic",
                    "recusandaetemporeaut",
                    "suntveritatisconsequatur",
                    "expeditaaccusamustotam",
                    "doloresutqui",
                  ];
                  const ranNum = Math.floor(Math.random() * 10);
                  const url = `${listAva[ranNum]}.png`;
                  const user = new User({
                    full_name,
                    email,
                    password: hash,
                    status: "success",
                    avatar: `https://robohash.org/${url}?size=100x100&set=set1`,
                    phone,
                    buy_package,
                    groupNumber,
                    parentId: donate_sales_id,
                    created_time: new Date(),
                    id_code,
                    be_member,
                    issued_by,
                    bank_account,
                    bank_name,
                    iden_type,
                    tax_code,
                    birthday,
                    gender,
                    id_time,
                  });
  
                  user.save(function (err) {
                    if (err) {
                      console.log(err);
                      return res.json({
                        status: 400,
                        errors: [],
                        message:
                          "Lưu thông tin không thành công.Vui lòng thử lại sau!",
                      });
                    } else {
                      const newTree = new Tree({
                        parent: user._id,
                        buy_package,
                      });
  
                      newTree.save(async function (err) {
                        if (err) {
                          return res.json({
                            status: 400,
                            errors: [],
                            message:
                              "Lưu cây hệ thống không thành công.Vui lòng thử lại sau!",
                          });
                        } else {
                          const parentEmail = userOfInvite.email;
                          const parentName = userOfInvite.full_name;
  
                          const oneYearFromNow = new Date();
                          oneYearFromNow.setFullYear(
                            oneYearFromNow.getFullYear() + 1
                          );
  
                          await User.findOneAndUpdate(
                            { _id: invite_code },
                            {
                              amount:
                                buy_package === "1"
                                  ? userOfInvite.amount + 40
                                  : userOfInvite.amount + 160,
                            }
                          ).exec();
  
                          await updateParent(invite_code, buy_package);
                          await returnCommission(
                            invite_code,
                            process.env.COMMISSION,
                            parentName,
                            "Chuyển khoản"
                          );
  
                          if (groupNumber === "1") {
                            Tree.findOneAndUpdate(
                              {
                                parent: userOfDonateSales._id,
                              },
                              {
                                $push: { group1: user._id },
                              },
                              async function (err) {
                                if (err) {
                                  console.log("thêm id vào cha thất bại");
                                  res.json({
                                    status: 400,
                                    errors: [],
                                    message: "Thêm id vào cha thất bại",
                                  });
                                } else {
                                  returnActiveAppMail(full_name, email, phone);
                                  thankMail(parentName, parentEmail, full_name);
                                  await Transaction.findOneAndUpdate({token}, {token: ""});
                                  res.json({
                                    status: 200,
                                    message:
                                      "🎉 Đăng ký thành công. Kiểm tra Email để được hướng dẫn đăng nhập",
                                    errors: [],
                                  });
                                }
                              }
                            );
                          } else if (groupNumber === "2") {
                            Tree.findOneAndUpdate(
                              { parent: userOfDonateSales._id },
                              {
                                $push: { group2: user._id },
                              },
                              function (err) {
                                if (err) {
                                  console.log("thêm id vào cha thất bại");
                                  res.json({
                                    status: 400,
                                    errors: [],
                                    message: "Thêm id vào cha thất bại",
                                  });
                                } else {
                                  returnActiveAppMail(full_name, email, phone);
                                  thankMail(parentName, parentEmail, full_name);
                                  res.json({
                                    status: 200,
                                    message:
                                      "🎉 Đăng ký thành công. Kiểm tra Email để được hướng dẫn đăng nhập",
                                    errors: [],
                                  });
                                }
                              }
                            );
                          } else if (groupNumber === "3") {
                            Tree.findOneAndUpdate(
                              { parent: userOfDonateSales._id },
                              {
                                $push: { group3: user._id },
                              },
                              function (err) {
                                if (err) {
                                  console.log("thêm id vào cha thất bại");
                                  res.json({
                                    status: 400,
                                    errors: [],
                                    message: "Thêm id vào cha thất bại",
                                  });
                                } else {
                                  returnActiveAppMail(full_name, email, phone);
                                  thankMail(parentName, parentEmail, full_name);
                                  res.json({
                                    status: 200,
                                    message:
                                      "🎉 Đăng ký thành công, Kiểm tra Email để được hướng dẫn đăng nhập",
                                    errors: [],
                                  });
                                }
                              }
                            );
                          } else {
                            console.log("thêm id vào cha thất bại");
                            return res.json({
                              status: 400,
                              errors: [],
                              message: "sai nhóm",
                            });
                          }
                        }
                      });
                    }
                  });
                }
              });
            });
          }
        }
      );
    }
  } else {
    return res.json({
      message: "Server! Có lỗi xảy ra.Vui lòng thử lại.",
    });
  }
};

exports.loginController = (req, res) => {
  const { acc, password } = req.body;

  User.findOne({
    $or: [{ email: acc }, { phone: acc }],
  }).exec((err, user) => {
    if (err || !user) {
      return res.json({
        status: 401,
        message: "Thông tin đăng nhập không đúng! Vui lòng thử lại",
        errors: [
          {
            label: "acc",
            err_message:
              "Email hoặc số điện thoại không hợp lệ. Vui lòng đăng ký",
          },
        ],
      });
    }
    bcrypt.compare(password, user.password, function (err, result) {
      // result == true
      if (!result || err) {
        return res.json({
          status: 401,
          message: "Thông tin đăng nhập không đúng! Vui lòng thử lại",
          errors: [
            {
              label: "password",
              err_message: "Mật khẩu không đúng.Vui lòng thử lại",
            },
          ],
        });
      } else {
        // generate a token and send to client
        const access_token = jwt.sign(
          {
            _id: user._id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1d",
          }
        );
        return res.json({
          status: 200,
          data: {
            access_token,
            user: {
              id: user._id,
              avatar: user.avatar,
              full_name: user.full_name,
              amount: user.amount,
              level: user.level,
              point: user.point,
              role: user.role,
              phone: user.phone,
              email: user.email,
            },
          },
          message: "Đăng nhập thành công",
          errors: [],
        });
      }
    });
  });
};

exports.userInfoController = (req, res) => {
  const { values } = req.body;

  const {
    token,
    birthday,
    gender,
    accept_confirm,
    id_code,
    id_time,
    issued_by,
    bank,
    bank_account,
    bank_name,
    iden_type,
    tax_code,
    // ID_front_side,
    // ID_back_side,
    complete_profile_level,
  } = values;

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Add info error");
      res.json({
        success: false,
        errors: [
          {
            label: "add_info_error",
            err_message: "Phiên đăng nhập hết hạn, Vui lòng đăng nhập lại",
          },
        ],
      });
    } else {
      const { _id } = jwt.decode(token);

      User.findOneAndUpdate(
        { _id },
        {
          birthday,
          gender,
          accept_confirm,
          id_code,
          id_time,
          issued_by,
          bank,
          bank_account,
          bank_name,
          iden_type,
          tax_code,
          // ID_front_side,
          // ID_back_side,
          complete_profile_level,
        },
        async (err) => {
          if (err) {
            return res.json({
              success: false,
              errors: [
                {
                  label: "add-info-err",
                  err_message:
                    "Bổ sung dữ liệu không thành công.Vui lòng thử lại.",
                },
              ],
            });
          } else {
            await Commission.updateMany(
              { receive_mem: _id },
              { qualified: true }
            ).exec();

            res.json({
              success: true,
              message: "🎉 Bổ sung thông tin thành công, Xin mời đăng nhập lại",
            });
          }
        }
      );
    }
  });
};

exports.loginRequest = async (req, res) => {
  const { id } = req.query;
  const user = await User.findOne({ _id: id }).exec();

  var targetNumber;
  var countLevel;
  switch (user.level) {
    case 0:
      targetNumber = process.env.STEP1_NUMBER;
      countLevel = 0;
      break;
    case 1:
      targetNumber = process.env.STEP2_NUMBER;
      countLevel = 1;
      break;
    case 2:
      targetNumber = process.env.STEP3_NUMBER;
      countLevel = 2;
      break;
    case 3:
      targetNumber = process.env.STEP4_NUMBER;
      countLevel = 3;
      break;
    case 4:
      targetNumber = process.env.STEP5_NUMBER;
      countLevel = 4;
      break;
    case 5:
      targetNumber = process.env.STEP6_NUMBER;
      countLevel = 5;
      break;
    default:
      targetNumber = 0;
      countLevel = 0;
  }
  const treeOfUser = await Tree.findOne({ parent: id })
    .select("group1 group2 group3")
    .exec();
  const totalChildMemberGroup1 = await countTotalChildMemberForLevel(
    [...treeOfUser.group1],
    0,
    countLevel
  );
  const totalChildMemberGroup2 = await countTotalChildMemberForLevel(
    [...treeOfUser.group2],
    0,
    countLevel
  );
  const totalChildMemberGroup3 = await countTotalChildMemberForLevel(
    [...treeOfUser.group3],
    0,
    countLevel
  );
  const totalPersonPackage = await countTotalPersonPackage(
    [...treeOfUser.group1, ...treeOfUser.group2, ...treeOfUser.group3],
    0,
    countLevel
  );
  console.log("Nhóm 1", totalChildMemberGroup1);
  console.log("Nhóm 2", totalChildMemberGroup2);
  console.log("Nhóm 3", totalChildMemberGroup3);
  res.json({
    user,
    totalGroup1: totalChildMemberGroup1,
    totalGroup2: totalChildMemberGroup2,
    totalGroup3: totalChildMemberGroup3,
    totalPersonPackage,
    targetNumber: parseInt(targetNumber),
  });
};

exports.forgotPasswordController = async (req, res) => {
  const { email } = req.body;

  console.log(email);

  const user = await User.findOne({ email }).exec();

  if (!user) {
    res.json({
      success: false,
      errors: [
        {
          label: "email",
          err_message: "Người dùng với email này không tồn tại",
        },
      ],
    });
  } else {
    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_RESET_PASSWORD,
      {
        expiresIn: "10m",
      }
    );

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `ĐƯỜNG DẪN CẤP LẠI MẬT KHẨU`,
      html: `
                    <h1>Bấm vào link này để đổi mật khẩu</h1>
                    <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                    <hr />
                    <p>Mọi chi tiết vui lòng liên hệ : </p>
                    <p>${process.env.CLIENT_URL}</p>
                `,
    };

    return user.updateOne(
      {
        resetPasswordLink: token,
      },
      (err, success) => {
        if (err) {
          console.log("RESET PASSWORD LINK ERROR", err);
          return res.json({
            success: false,
            errors: [
              {
                label: "data_connect_fail",
                err_message:
                  "📍 Lỗi kết nối cơ sở dữ liệu trên yêu cầu quên mật khẩu người dùng",
              },
            ],
          });
        } else {
          sgMail
            .send(emailData)
            .then((sent) => {
              return res.json({
                success: true,
                message: `🎉 Mail đã được gửi đến ${email}. Làm theo hướng dẫn để kích hoạt tài khoản của bạn`,
              });
            })
            .catch((err) => {
              return res.json({
                success: false,
                errors: [
                  {
                    label: "email_send_fail",
                    err_message: "📍 Gửi mail thất bại.Vui lòng thử lại sau!",
                  },
                ],
              });
            });
        }
      }
    );
  }
};

exports.resetPasswordController = async (req, res) => {
  const { values } = req.body;

  const { newPassword, token } = values;

  const resetPasswordLink = token;

  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      async function (err, decoded) {
        if (err) {
          return res.json({
            success: false,
            errors: [
              {
                label: "token-expired",
                err_message: "Đường link đã hết hạn.Vui lòng thử lại",
              },
            ],
          });
        }

        const user = await User.findOne({ resetPasswordLink }).exec();

        if (!user) {
          return res.json({
            success: false,
            errors: [
              {
                label: "token-fake",
                err_message: "Đường link sai.Vui lòng thử lại",
              },
            ],
          });
        } else {
          bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
            // Store hash in your password DB.
            const result = await User.findOneAndUpdate(
              { _id: user._id },
              {
                hashed_password: hash,
                resetPasswordLink: "",
              },
              {
                returnOriginal: false,
              }
            ).exec();

            if (!result) {
              return res.json({
                success: false,
                errors: [
                  {
                    label: "user-save-fail",
                    err_message: "Lỗi khi đặt lại mật khẩu người dùng",
                  },
                ],
              });
            } else {
              return res.json({
                success: true,
                message: `🎉 Tuyệt vời! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới của mình`,
              });
            }
          });
        }
      }
    );
  }
};

exports.addDemoData = async (req, res) => {
  const {
    full_name,
    email,
    invite_code,
    password,
    buy_package,
    group,
    phone,
    payment_method,
    created_by,
  } = req.query;

  bcrypt.genSalt(saltRounds, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      if (err) {
        console.log(err);
        return res.json(err);
      } else {
        const userOfDonateSales = await User.findOne({
          phone: invite_code,
        }).exec();

        const listAva = [
          "similiquealiasoccaecati",
          "molestiaeimpeditdolor",
          "voluptatesabinventore",
          "quinemoitaque",
          "ametenimomnis",
          "aliquamprovidenthic",
          "recusandaetemporeaut",
          "suntveritatisconsequatur",
          "expeditaaccusamustotam",
          "doloresutqui",
        ];
        const ranNum = Math.floor(Math.random() * 10);
        const url = `${listAva[ranNum]}.png`;
        const user = new User({
          full_name,
          email,
          hashed_password: hash,
          complete_profile_level: 1,
          status: "success",
          avatar: `https://robohash.org/${url}?size=100x100&set=set1`,
          phone,
          buy_package,
          groupNumber: group,
          parentId: userOfDonateSales._id,
          created_time: new Date(),
        });

        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        const transaction = new Transaction({
          status: "success",
          approved_by: "admin",
          payment_method,
          token: "",
          created_time: new Date(),
          created_by,
          email,
          phone,
          approved_time: "",
          expired_time: oneYearFromNow,
          buy_package,
        });

        await transaction.save(function (err) {
          if (err) {
            console.log("error when save transaction", err);
          }
        });

        await user.save(function (err) {
          if (err) {
            console.log(err);
            return res.json({
              success: false,
              errors: [
                {
                  label: "save user error",
                  err_message: "save user error",
                },
              ],
            });
          } else {
            const newTree = new Tree({
              parent: user._id,
              buy_package,
            });

            newTree.save(async function (err) {
              if (err) {
                res.json({
                  success: false,
                  errors: [
                    {
                      label: "save tree error",
                      err_message: "Lỗi khi lưu cây",
                    },
                  ],
                });
              } else {
                const parentEmail = userOfDonateSales.email;
                const parentName = userOfDonateSales.full_name;

                if (group === "1") {
                  Tree.findOneAndUpdate(
                    {
                      parent: userOfDonateSales._id,
                    },
                    {
                      $push: { group1: user._id },
                    },
                    function (err) {
                      if (err) {
                        console.log("ko tim thấy invite code");
                        res.json({
                          success: false,
                          errors: [
                            {
                              label: "save user error",
                              err_message: "save user error",
                            },
                          ],
                        });
                      } else {
                        returnActiveAppMail(full_name, email, phone);
                        thankMail(parentName, parentEmail, full_name);
                        res.json({
                          success: true,
                          message:
                            "🎉 Đăng ký thành công, Kiểm tra Email để được hướng dẫn đăng nhập",
                        });
                      }
                    }
                  );
                } else if (group === "2") {
                  Tree.findOneAndUpdate(
                    { parent: userOfDonateSales._id },
                    {
                      $push: { group2: user._id },
                    },
                    function (err) {
                      if (err) {
                        console.log("ko tim thấy invite code");
                        res.json({
                          success: false,
                          errors: [
                            {
                              label: "save user error",
                              err_message: "save user error",
                            },
                          ],
                        });
                      } else {
                        returnActiveAppMail(full_name, email, phone);
                        thankMail(parentName, parentEmail, full_name);
                        res.json({
                          success: true,
                          message:
                            "🎉 Đăng ký thành công, Kiểm tra Email để được hướng dẫn đăng nhập",
                        });
                      }
                    }
                  );
                } else if (group === "3") {
                  Tree.findOneAndUpdate(
                    { parent: userOfDonateSales._id },
                    {
                      $push: { group3: user._id },
                    },
                    function (err) {
                      if (err) {
                        console.log("ko tim thấy invite code");
                        res.json({
                          success: false,
                          errors: [
                            {
                              label: "save user error",
                              err_message: "save user error",
                            },
                          ],
                        });
                      } else {
                        returnActiveAppMail(full_name, email, phone);
                        thankMail(parentName, parentEmail, full_name);
                        res.json({
                          success: true,
                          message:
                            "🎉 Đăng ký thành công, Kiểm tra Email để được hướng dẫn đăng nhập",
                        });
                      }
                    }
                  );
                } else {
                  return res.json({
                    success: false,
                    errors: [
                      {
                        label: "error group",
                        err_message: "Nhóm không phù hợp.Vui lòng thử lại",
                      },
                    ],
                  });
                }
              }
            });
          }
        });

        await User.findOneAndUpdate(
          { phone: invite_code },
          {
            amount:
              buy_package === "1"
                ? userOfDonateSales.amount + 40
                : userOfDonateSales.amount + 160,
          }
        );

        await updateParent(userOfDonateSales, buy_package);
        const qualified =
          userOfDonateSales.complete_profile_level !== 1 ? true : false;
        await returnCommission(
          userOfDonateSales._id,
          process.env.COMMISSION,
          full_name,
          "Chuyển khoản",
          qualified
        );
        // await saveExtension()
      }
    });
  });
};

const returnCommission = async (
  receive_mem,
  amount,
  join_mem,
  payment_method,
  qualified
) => {
  const commission = new Commission({
    receive_mem,
    amount,
    join_mem,
    created_time: new Date(),
    payment_method,
    active_admin: false,
    status: "pending",
    qualified,
  });

  await commission.save(function (err) {
    if (err) {
      console.log("error add commission", err);
    } else {
      console.log("saved commission");
    }
  });
};
