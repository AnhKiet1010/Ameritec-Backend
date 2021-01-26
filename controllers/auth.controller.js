const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Tree = require("../models/tree.model");
const Commission = require("../models/commission.model");
const Extension = require("../models/extension.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.MAIL_KEY);

const saltRounds = 10;

const e = require("express");

exports.tranController = async (req, res) => {
  const { regis_email, payment_method } = req.body;

  Transaction.findOneAndUpdate(
    { email: regis_email },
    { payment_method },
    function (err) {
      if (err) {
        res.json({
          success: false,
          errors: [
            {
              label: "transaction",
              err_message: "Lỗi khi cập nhật giao dịch.Vui lòng thử lại sau",
            },
          ],
        });
      } else {
        res.json({
          success: true,
        });
      }
    }
  );
};

exports.registerController = async (req, res) => {
  const { values, group, buy_package } = req.body;
  const { full_name, email, phone, invite_code, password } = values;

  const user_repeat_email = await User.findOne({ email }).exec();
  const valid_invite_code = await User.findOne({ phone: invite_code }).exec();
  const valid_phone = await User.findOne({ phone }).exec();

  await Transaction.deleteMany({ email, status: "pending" }).exec();

  const errors = [];

  if (user_repeat_email) {
    errors.push({ label: "email", err_message: "Email này đã được sử dụng" });
  }

  if (!valid_invite_code) {
    errors.push({
      label: "invite_code",
      err_message: "Link giới thiệu bị sai.Vui lòng kiểm tra lại",
    });
  }

  if (valid_phone) {
    errors.push({
      label: "phone",
      err_message: "Số điện thoại đã được sử dụng.Vui lòng chọn số khác",
    });
  }

  if (errors.length > 0) {
    res.json({ success: false, errors });
  } else {
    const token = jwt.sign(
      {
        full_name,
        email,
        invite_code,
        password,
        buy_package,
        group,
        phone,
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
      buy_package
    });

    await newTransaction.save(function (err) {
      if (err) {
        console.log("fail to save transaction!");
        res.json({
          success: false,
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
          success: true,
          message: `🎉 Mời bạn tiến hành thanh toán`,
          parentEmail: email,
        });
      }
    });
  }
};

exports.activationController = (req, res) => {
  const { values } = req.body;

  const { token } = values;

  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACCOUNT_ACTIVATION,
      async (err, decoded) => {
        if (err) {
          console.log("Activation error");
          res.json({
            success: false,
            errors: [
              {
                label: "activation_error",
                err_message: "Đường dẫn đã hết hạn.Vui lòng đăng ký lại",
              },
            ],
          });
        } else {
          const {
            full_name,
            email,
            invite_code,
            password,
            buy_package,
            group,
            phone,
          } = jwt.decode(token);

          bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
              if (err) {
                console.log(err);
                return res.json(err);
              } else {
                const userOfPhone = await User.findOne({
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
                  parentId: userOfPhone._id,
                  created_time: new Date(),
                });

                user.save(function (err) {
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
                        const parentEmail = userOfPhone.email;
                        const parentName = userOfPhone.full_name;

                        const oneYearFromNow = new Date();
                        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

                        await Transaction.findOneAndUpdate({email}, {status: 'success', expired_time: oneYearFromNow}).exec();

                        await User.findOneAndUpdate(
                          { phone: invite_code },
                          {
                            amount:
                              buy_package === "1"
                                ? userOfPhone.amount + 40
                                : userOfPhone.amount + 160,
                          }
                        ).exec();
        
                        await updateParent(userOfPhone._id, buy_package);
                        await returnCommission(userOfPhone._id, process.env.COMMISSION, parentName, "Chuyển khoản");

                        if (group === "1") {
                          Tree.findOneAndUpdate(
                            {
                              parent: userOfPhone._id,
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
                            { parent: userOfPhone._id },
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
                            { parent: userOfPhone._id },
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
                                err_message:
                                  "Nhóm không phù hợp.Vui lòng thử lại",
                              },
                            ],
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
  } else {
    return res.json({
      message: "Server! Có lỗi xảy ra.Vui lòng thử lại.",
    });
  }
};

const updateParent = async (id, buy_package) => {
  const parent = await User.findOne({ _id: id }).exec();
  const checkUp = await checkUpLevel(parent, buy_package);

  await User.findOneAndUpdate(
    { _id: id },
    {
      point: buy_package === "1" ? parent.point + 0.25 : parent.point + 1,
      level: checkUp ? parent.level + 1 : parent.level,
    }
  );

  if (parent.parentId === "") {
    return;
  } else {
    await updateParent(parent.parentId, buy_package);
  }
};

const checkUpLevel = async (user, buy_package) => {
  if (buy_package === 1) {
    return;
  } else {
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

    const treeOfUser = await Tree.findOne({ parent: user._id })
      .select("group1 group2 group3")
      .exec();
    const listChildAllGroupOfUser = [
      ...treeOfUser.group1,
      ...treeOfUser.group2,
      ...treeOfUser.group3,
    ];
    const totalChildMember =
      (await countTotalChildMemberForLevel(listChildAllGroupOfUser)) + 1;
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
    console.log("nhóm 1", totalChildMemberGroup1);
    console.log("nhóm 2", totalChildMemberGroup2);
    console.log("nhóm 3", totalChildMemberGroup3);
    console.log("tất cả", totalChildMember);
    console.log("target", targetNumber);
    if (totalChildMember < targetNumber) {
      return false;
    } else if (
      totalChildMemberGroup1 >= Math.floor(parseInt(targetNumber) / 4) &&
      totalChildMemberGroup2 >= Math.floor(parseInt(targetNumber) / 4) &&
      totalChildMemberGroup3 >= Math.floor(parseInt(targetNumber) / 4)
    ) {
      return true;
    }
  }
};

const returnActiveAppMail = (full_name, email, phone) => {
  const emailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "💌 ĐÃ KÍCH HOẠT TÀI KHOẢN THÀNH CÔNG",
    html: `<!DOCTYPE html>
    <html lang="en">
          <head>
          <meta name="format-detection" content="telephone=no">
          <meta name="format-detection" content="email=no">
          </head>
          <body>
              <h1>THÔNG TIN</h1>
                <ul>
                  <li>Họ và Tên : ${full_name}</li>
                  <li>Email : ${email}</li>
                  <li>Số điện thoại : ${phone}</li>
                  <li>Mã giới thiệu : 
                      <ul>
                        <li>Link nhóm 1 : <a href="${process.env.CLIENT_URL}/${phone}/1"></a></li>
                        <li>Link nhóm 2 : <a href="${process.env.CLIENT_URL}/${phone}/2"></a></li>
                        <li>Link nhóm 3 : <a href="${process.env.CLIENT_URL}/${phone}/3"></a></li>
                      </ul>
                  </li>
                </ul>
              <h1>ĐƯỜNG DẪN KÍCH HOẠT AIPS APP</h1>
              <ul>
                <li>link 1 : <a href="zips://activation?token=U2FsdGVkX1-0HlEFH0STXLXPwYn7HyLBjS1XQTQOR1wKVs7e2oR4H4CjSU2mO-fbVGX_Ll-CaGbXXWFsX2lMlFSJATdiDOVR70_6A-29cSk1x9yccHoO2Q_XJEAm65lPSfrM5roMSXpEIyGedPyv_15-izX_lq5XlavYKpkDlblRztWi7kHI6K32ykxus7fDTbKeHinT-eirKFQnpzPXulbXawQ2of7NKw-vH3QZRLVr4rvPdTkUYCAL3LHwc3hivxgKq80fDGsONkNysnZv-g0V5tRmrmIz7XZiarVdIIz1_OTTxCwfz7Qyj74fFmrDeiABu3aHOgY2XMoudPiz5mDXC_5ZN8UtxvchU8YJyEGFAlKfY6ptfI4-UCfFR1QX6j3auKIP8DciX3Sri6UOgxzd8iDuaLjSORl-ANoNylK0aTeLE-gNtijrZuBu2g8aomPRU-cUwqHOJ--6qZQ9MduazPoMb0X3DZoKaUO0MzIEWR3hAgMx_UfTbdBjLKDg&redirect_uri=zips">nhấp vào đây để active</a></li>
                <li>link 2 : <a href="zips://activation?token=U2FsdGVkX1-0HlEFH0STXLXPwYn7HyLBjS1XQTQOR1wKVs7e2oR4H4CjSU2mO-fbVGX_Ll-CaGbXXWFsX2lMlFSJATdiDOVR70_6A-29cSk1x9yccHoO2Q_XJEAm65lPSfrM5roMSXpEIyGedPyv_15-izX_lq5XlavYKpkDlblRztWi7kHI6K32ykxus7fDTbKeHinT-eirKFQnpzPXulbXawQ2of7NKw-vH3QZRLVr4rvPdTkUYCAL3LHwc3hivxgKq80fDGsONkNysnZv-g0V5tRmrmIz7XZiarVdIIz1_OTTxCwfz7Qyj74fFmrDeiABu3aHOgY2XMoudPiz5mDXC_5ZN8UtxvchU8YJyEGFAlKfY6ptfI4-UCfFR1QX6j3auKIP8DciX3Sri6UOgxzd8iDuaLjSORl-ANoNylK0aTeLE-gNtijrZuBu2g8aomPRU-cUwqHOJ--6qZQ9MduazPoMb0X3DZoKaUO0MzIEWR3hAgMx_UfTbdBjLKDg&redirect_uri=zips">nhấp vào đây để active</a></li>
                <li>link 3 : <a href="zips://activation?token=U2FsdGVkX1-0HlEFH0STXLXPwYn7HyLBjS1XQTQOR1wKVs7e2oR4H4CjSU2mO-fbVGX_Ll-CaGbXXWFsX2lMlFSJATdiDOVR70_6A-29cSk1x9yccHoO2Q_XJEAm65lPSfrM5roMSXpEIyGedPyv_15-izX_lq5XlavYKpkDlblRztWi7kHI6K32ykxus7fDTbKeHinT-eirKFQnpzPXulbXawQ2of7NKw-vH3QZRLVr4rvPdTkUYCAL3LHwc3hivxgKq80fDGsONkNysnZv-g0V5tRmrmIz7XZiarVdIIz1_OTTxCwfz7Qyj74fFmrDeiABu3aHOgY2XMoudPiz5mDXC_5ZN8UtxvchU8YJyEGFAlKfY6ptfI4-UCfFR1QX6j3auKIP8DciX3Sri6UOgxzd8iDuaLjSORl-ANoNylK0aTeLE-gNtijrZuBu2g8aomPRU-cUwqHOJ--6qZQ9MduazPoMb0X3DZoKaUO0MzIEWR3hAgMx_UfTbdBjLKDg&redirect_uri=zips">nhấp vào đây để active</a></li>
                <li>link 4 : <a href="zips://activation?token=U2FsdGVkX1-0HlEFH0STXLXPwYn7HyLBjS1XQTQOR1wKVs7e2oR4H4CjSU2mO-fbVGX_Ll-CaGbXXWFsX2lMlFSJATdiDOVR70_6A-29cSk1x9yccHoO2Q_XJEAm65lPSfrM5roMSXpEIyGedPyv_15-izX_lq5XlavYKpkDlblRztWi7kHI6K32ykxus7fDTbKeHinT-eirKFQnpzPXulbXawQ2of7NKw-vH3QZRLVr4rvPdTkUYCAL3LHwc3hivxgKq80fDGsONkNysnZv-g0V5tRmrmIz7XZiarVdIIz1_OTTxCwfz7Qyj74fFmrDeiABu3aHOgY2XMoudPiz5mDXC_5ZN8UtxvchU8YJyEGFAlKfY6ptfI4-UCfFR1QX6j3auKIP8DciX3Sri6UOgxzd8iDuaLjSORl-ANoNylK0aTeLE-gNtijrZuBu2g8aomPRU-cUwqHOJ--6qZQ9MduazPoMb0X3DZoKaUO0MzIEWR3hAgMx_UfTbdBjLKDg&redirect_uri=zips">nhấp vào đây để active</a></li>
              </ul>
              <hr />
              <p>Mọi thông tin xin vui lòng liên hệ</p>
              <p>${process.env.CLIENT_URL}</p>
              <p>Link đăng nhập</p>
              <p>${process.env.CLIENT_URL}/login</p>
          </body>
          </html>
          `,
  };

  sgMail.send(emailData, async (error, result) => {
    if (error) {
      console.log("error when send email success!");
      return false;
    } else {
      console.log("success mail sended!!!!");
      return true;
    }
  });
};

const thankMail = (parentName, parentEmail, full_name) => {
  const emailData = {
    from: process.env.EMAIL_FROM,
    to: parentEmail,
    subject: "💌 THƯ CẢM ƠN BẠN ĐÃ GIỚI THIỆU TÀI KHOẢN",
    html: `<!DOCTYPE html>
    <html lang="en">
          <head>
          <meta name="format-detection" content="telephone=no">
          <meta name="format-detection" content="email=no">
          </head>
          <body>
              <h1>AMERITEC XIN CHÂN THÀNH CẢM ƠN</h1>
                <ul>
                  <li>Tài khoản : ${parentName} đã giới thiệu thành công Anh/Chị : ${full_name} tham gia vào hệ thống</li>
                </ul>
              <hr />
              <p>Mọi thông tin xin vui lòng liên hệ</p>
              <p>${process.env.CLIENT_URL}</p>
              <p>Link đăng nhập</p>
              <p>${process.env.CLIENT_URL}/login</p>
          </body>
          </html>
          `,
  };

  sgMail.send(emailData, async (error, result) => {
    if (error) {
      console.log("error when send email thanks");
      return false;
    } else {
      console.log("thanks mail sended!!!!");
      return true;
    }
  });
};

exports.loginController = (req, res) => {
  const { acc, password } = req.body;

  User.findOne({
    $or: [{ email: acc }, { phone: acc }],
  }).exec((err, user) => {
    if (err || !user) {
      return res.json({
        success: false,
        errors: [
          {
            label: "acc",
            err_message:
              "Email hoặc số điện thoại không hợp lệ. Vui lòng đăng ký",
          },
        ],
      });
    }
    // authenticate
    bcrypt.compare(password, user.hashed_password, function (err, result) {
      // result == true
      if (!result || err) {
        return res.json({
          success: false,
          errors: [
            {
              label: "password",
              err_message: "Mật khẩu không đúng. Vui lòng thử lại",
            },
          ],
        });
      }
      // generate a token and send to client
      const token = jwt.sign(
        {
          _id: user._id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return res.json({
        success: true,
        token,
        user: {
          avatar: user.avatar,
          full_name: user.full_name,
          amount: user.amount,
          level: user.level,
          point: user.point,
          role: user.role,
          _id: user._id,
          phone: user.phone,
        },
      });
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

            await Commission.updateMany({receive_mem: _id}, {qualified : true}).exec();

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

const countTotalChildMemberForLevel = async (
  subTreeIdList,
  countLevel,
  level
) => {
  var count = 0;
  for (let id of subTreeIdList) {
    let branchObject = await Tree.findOne({ parent: id })
      .select("buy_package")
      .exec();
    if (branchObject.buy_package !== "1") {
      count++;
    }
  }

  if (countLevel === level) {
    return count;
  } else {
    for (let i = 0; i < subTreeIdList.length; i++) {
      let branchObject = await Tree.findOne({ parent: subTreeIdList[i]._id })
        .select("group1 group2 group3 buy_package")
        .exec();

      if (branchObject) {
        let group = [
          ...branchObject.group1,
          ...branchObject.group2,
          ...branchObject.group3,
        ];
        if (group.length !== 0 && branchObject.buy_package !== "1") {
          count += await countTotalChildMemberForLevel(
            group,
            countLevel++,
            level
          );
        } else {
          return count;
        }
      } else {
        continue;
      }
    }
  }
};

const countTotalPersonPackage = async (subTreeIdList, countLevel, level) => {
  var count = 0;
  for (let id of subTreeIdList) {
    let branchObject = await Tree.findOne({ parent: id })
      .select("buy_package")
      .exec();
    if (branchObject.buy_package === "1") {
      count++;
    }
  }

  if (countLevel === level) {
    return count;
  } else {
    for (let i = 0; i < subTreeIdList.length; i++) {
      let branchObject = await Tree.findOne({ parent: subTreeIdList[i]._id })
        .select("group1 group2 group3 buy_package")
        .exec();

      console.log("buy!!!!!!", branchObject.buy_package);

      if (branchObject) {
        let group = [
          ...branchObject.group1,
          ...branchObject.group2,
          ...branchObject.group3,
        ];
        if (group.length !== 0 && branchObject.buy_package === "1") {
          count += await countTotalChildMemberForLevel(
            group,
            countLevel++,
            level
          );
        } else {
          return count;
        }
      } else {
        continue;
      }
    }
  }
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
        const userOfPhone = await User.findOne({
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
          parentId: userOfPhone._id,
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
          buy_package
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
                const parentEmail = userOfPhone.email;
                const parentName = userOfPhone.full_name;

                if (group === "1") {
                  Tree.findOneAndUpdate(
                    {
                      parent: userOfPhone._id,
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
                    { parent: userOfPhone._id },
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
                    { parent: userOfPhone._id },
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
                ? userOfPhone.amount + 40
                : userOfPhone.amount + 160,
          }
        );

        await updateParent(userOfPhone._id, buy_package);
        const qualified = userOfPhone.complete_profile_level !== 1 ? true : false;
        await returnCommission(userOfPhone._id, process.env.COMMISSION, full_name, "Chuyển khoản",qualified);
        // await saveExtension()
      }
    });
  });
};

exports.addAgency = async (req,res) => {
  const {
    full_name,
    email,
    password,
    buy_package,
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
          avatar: `https://robohash.org/${url}?size=100x100&set=set1`,
          phone,
          buy_package,
          parentId: "",
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
          buy_package
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
              }
            });
          }
        });
        res.json({
          success: true,
          message: 'Saved Agency!!!'
        })
      }
    });
  });
}

const returnCommission = async (receive_mem, amount, join_mem, payment_method, qualified) => {
  const commission = new Commission({
    receive_mem, 
    amount, 
    join_mem,
    created_time: new Date(),
    payment_method,
    active_admin: 'Admin',
    status: 'pending',
    qualified
  });

  await commission.save(function (err) {
    if(err) {
      console.log("error add commission", err)
    } else {
      console.log("saved commission");
    }
  })
}

const saveExtension = async (parent, amount,payment_method) => {

  var oneYearFromNow = new Date();
oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  const extension = new Extension({
    parent, 
    amount, 
    created_time: new Date(),
    expired_time: oneYearFromNow,
    payment_method
  });

  await extension.save(function (err) {
    if(err) {
      console.log("error add extension", err)
    } else {
      console.log("saved extension");
    }
  })
}
