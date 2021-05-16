const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Tree = require("../models/tree.model");
const Commission = require("../models/commission.model");
const Activation = require("../models/activation.model");
const axios = require("axios");
const { thankMail, successMail, randomString } = require("./method");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const e = require("express");
const fs = require('fs');
const { Mail } = require("./mail");

const saltRounds = 10;

const getActiveLink = async (email, full_name, phone, buy_package) => {
  let accessToken = "";
  let groupId = "";
  var links = [];
  await axios
    .post(`${process.env.APP_ZIMPERIUM_LOGIN_LINK}`, {
      clientId: process.env.APP_ZIMPERIUM_CLIENT,
      secret: process.env.APP_ZIMPERIUM_SECRET,
    })
    .then((res) => {
      accessToken = res.data.accessToken;
    })
    .catch((err) => {
      console.log("err in get active link accessToken", err);
    });

  await axios
    .get(`${process.env.APP_GET_GROUPS_LINK}`, {
      headers: {
        Authorization: "Bearer " + accessToken,
        ContentType: "application/json",
      },
    })
    .then((res) => {
      groupId = res.data[0].id;
    })
    .catch((err) => {
      console.log("err in get active link groupId", err);
    });

  if (buy_package === "1") {
    await axios
      .post(
        `${process.env.APP_CREATE_USER_LINK}`,
        {
          activationLimit: 10,
          email: `${email}`,
          firstName: full_name,
          groupId,
          lastName: "1",
          phoneNumber: phone,
          sendEmailInvite: false,
          sendSmsInvite: false,
        },
        {
          headers: {
            Authorization: "Bearer " + accessToken,
            ContentType: "application/json",
          },
        }
      )
      .then(async (res) => {
        const activation = new Activation({
          linkId: res.data.id,
          accountId: res.data.accountId,
          groupId: res.data.groupId,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          activationLimit: res.data.activationLimit,
          activationCount: res.data.activationCount,
          licenseJwt: res.data.licenseJwt,
          shortToken: res.data.shortToken,
          created: res.data.created,
          modified: res.data.modified,
        });

        await activation.save((err) => {
          if (err) {
            console.log("err when save activation", err);
          }
        });
        links.push(res.data.shortToken);
        console.log('link in get', links);
      })
      .catch((err) => {
        console.log("err in get active link", err);
      });
  } else {
    for (let i = 0; i <= 3; i++) {
      let newEmail = email.split("@");

      let result = newEmail[0] + i + "@" + newEmail[1];
      await axios
        .post(
          `${process.env.APP_CREATE_USER_LINK}`,
          {
            activationLimit: 4,
            email: result,
            firstName: full_name,
            groupId,
            lastName: `${i}`,
            phoneNumber: phone,
            sendEmailInvite: false,
            sendSmsInvite: false,
          },
          {
            headers: {
              Authorization: "Bearer " + accessToken,
              ContentType: "application/json",
            },
          }
        )
        .then(async (res) => {
          links.push(res.data.shortToken);

          const activation = new Activation({
            linkId: res.data.id,
            accountId: res.data.accountId,
            groupId: res.data.groupId,
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            activationLimit: res.data.activationLimit,
            activationCount: res.data.activationCount,
            licenseJwt: res.data.licenseJwt,
            shortToken: res.data.shortToken,
            created: res.data.created,
            modified: res.data.modified,
          });

          await activation.save((err) => {
            if (err) {
              console.log("err when save activation", err);
            }
          });
        })
        .catch((err) => {
          console.log("err in get active link", err);
        });
    }
  }
  
  return links;
};

const updateParent = async (id, buy_package) => {
  const parent = await User.findOne({ _id: id }).exec();
  const checkUp = await checkUpLevel(id, buy_package);

  await User.findOneAndUpdate(
    { _id: parent._id },
    {
      point: buy_package === "1" ? parent.point + 0.25 : parent.point + 1,
      level: checkUp ? parent.level + 1 : parent.level,
    }
  );

  if (parent.parentId === "AMERITEC" || parent.parentId === "AMERITEC2021") {
    return;
  } else {
    await updateParent(parent.parentId, buy_package);
  }
};

const checkUpLevel = async (id, buy_package) => {
  const user = await User.findOne({ _id: id }).exec();
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

exports.checkLinkController = async (req, res) => {
  const { invite_code, donate_sales_id, group } = req.body;

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
    bank,
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

  console.log("body", req.body);
  var cmndMT = "";
  var cmndMS = "";

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

  if (errors.length > 0) {
    res.json({
      status: 401,
      errors,
      message: "Có lỗi xảy ra!",
    });
  } else {
    if (buy_package === "2") {

      const files = req.files;

      if (files.CMND_Front && files.CMND_Back) {
        const randomstring = randomString();

        // name of front image
        cmndMT = randomstring + '_front.' + files.CMND_Front[0].filename.split('.').pop();
        fs.rename('./' + files.CMND_Front[0].path, './public/uploads/CMND/' + cmndMT, (err) => {
          if (err) console.log(err);
        });

        // name of back image
        cmndMS = randomstring + '_back.' + files.CMND_Back[0].filename.split('.').pop();
        fs.rename('./' + files.CMND_Back[0].path, './public/uploads/CMND/' + cmndMS, (err) => {
          if (err) console.log(err);
        });
      } else {
        errors.push({
          label: "CMND_Front",
          err_message: "Vui lòng tải lên mặt trước CMND",
        },
          {
            label: "CMND_Back",
            err_message: "Vui lòng tải lên mặt sau CMND",
          });
      }

      if (id_code === "") {
        errors.push({
          label: "id_code",
          err_message: "Vui lòng điền số CMND",
        });
      }
      if (bank_account === "") {
        errors.push({
          label: "bank_account",
          err_message: "Vui lòng điền số tài khoản của Bạn",
        });
      }
      if (id_time === "") {
        errors.push({
          label: "id_time",
          err_message: "Vui lòng chọn ngày cấp CMND",
        });
      }
      if (issued_by === "") {
        errors.push({
          label: "issued_by",
          err_message: "Vui lòng chọn nơi cấp CMND",
        });
      }

      if (bank === "") {
        errors.push({
          label: "bank",
          err_message: "Vui lòng chọn ngân hàng bạn đang sử dụng",
        });
      }

      if (bank_name === "") {
        errors.push({
          label: "bank_name",
          err_message: "Vui lòng điền tên tài khoản của Bạn",
        });
      }

      const user_repeat_id_code = await User.findOne({ $and: [{ id_code: id_code }, { id_code: { $ne: "" } }] }).exec();
      const user_repeat_bank_account = await User.findOne({
        $and: [{ bank_account: bank_account }, { bank_account: { $ne: "" } }]
      }).exec();
      const user_repeat_tax_code = await User.findOne({ $and: [{ tax_code: tax_code }, { tax_code: { $ne: "" } }] }).exec();

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

    const token = jwt.sign(
      {
        full_name,
        email,
        password,
        phone,
        id_code,
        be_member,
        issued_by,
        bank,
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
        cmndMT,
        cmndMS
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
}

async function processDataActivation(data, token) {

  const {
    full_name,
    email,
    password,
    phone,
    id_code,
    be_member,
    issued_by,
    bank_account,
    bank,
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
    cmndMT,
    cmndMS
  } = data;

  const unSavedErr = [];

  bcrypt.genSalt(saltRounds, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {

      // --------------- FIND DONATE USER -------------------
      const userOfDonateSales = await User.findOne({
        _id: donate_sales_id,
      }).exec();

      const userOfInvite = await User.findOne({
        _id: invite_code,
      }).exec();

      // --------------- CREATE AVATAR -------------------
      const listCharacterOfName = full_name.split(" ");
      const avatarKey = `${listCharacterOfName[listCharacterOfName.length - 2]}+${listCharacterOfName[listCharacterOfName.length - 1]}`;


      // --------------- SAVE USER -------------------
      const user = new User({
        full_name,
        email,
        password: hash,
        status: "success",
        avatar: `https://ui-avatars.com/api/?name=${avatarKey}&background=random`,
        phone,
        buy_package,
        groupNumber,
        parentId: donate_sales_id,
        created_time: new Date(),
        id_code,
        be_member,
        issued_by,
        bank,
        bank_account,
        bank_name,
        iden_type,
        tax_code,
        birthday,
        gender,
        cmndMT,
        cmndMS,
        id_time,
        expired: false
      });

      user.save(function (err) {
        if (err) {
          unSavedErr.push({ field: "user" });
        } else {
          if (groupNumber === "1") {
            Tree.findOneAndUpdate(
              {
                parent: userOfDonateSales._id,
              },
              {
                $push: { group1: user._id },
              },
              async (err) => {
                if (err) {
                  throw err;
                }
              }
            );
          } else if (groupNumber === "2") {
            Tree.findOneAndUpdate(
              { parent: userOfDonateSales._id },
              {
                $push: { group2: user._id },
              },
              async function (err) {
                if (err) {
                  throw err;
                }
              });
          } else if (groupNumber === "3") {
            Tree.findOneAndUpdate(
              { parent: userOfDonateSales._id },
              {
                $push: { group3: user._id },
              },
              async function (err) {
                if (err) {
                  throw err;
                }
              }
            );
          } else {
            console.log("thêm id vào cha thất bại");
          }
        }
      });


      // --------------- SAVE TREE -------------------
      const newTree = new Tree({
        parent: user._id,
        buy_package,
      });


      newTree.save(async function (err) {
        if (err) {
          unSavedErr.push({ field: "tree" });
        }
      });

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(
        oneYearFromNow.getFullYear() + 1
      );


      // --------------- UPDATE AMOUNT OF PARENT -------------------
      await User.findOneAndUpdate(
        { _id: invite_code },
        {
          amount:
            buy_package === "1"
              ? userOfInvite.amount + 40
              : userOfInvite.amount + 160,
        }
      ).exec();

      // --------------- UPDATE LEVEL PARENT -------------------

      updateParent(invite_code, buy_package);

      // --------------- SAVE COMMISSTIONS -------------------
      returnCommission(
        invite_code,
        buy_package,
        full_name
      );

      // --------------- GET APP ACTIVATIONS LINKS -------------------
      const links = await getActiveLink(
        email,
        full_name,
        phone,
        buy_package
      );

      if (links.length === 0) {
        console.log(`Lấy link active thất bại! Vui lòng thử lại sau`);
        unSavedErr.push({ field: "links" });
      }

      // --------------- SEND SUCCESS MAIL -------------------
      successMail(
        full_name,
        email,
        phone,
        links
      );

      // --------------- SEND THANKS MAIL -------------------
      thankMail(
        userOfInvite.full_name,
        userOfInvite.email,
        full_name
      );

      // --------------- RESET TOKEN TO EMPTY -------------------
      await Transaction.findOneAndUpdate(
        { token },
        { token: "" }
      );

      // --------------- CONSOLE.LOG ERROR FIELD -------------------
      console.log("error field", unSavedErr);

    });
  });
}

exports.activationController = async (req, res) => {
  const { token } = req.body;

  const penddingTrans = await Transaction.findOne({ token }).exec();

  if (penddingTrans) {
    jwt.verify(
      token,
      process.env.JWT_ACCOUNT_ACTIVATION,
      async (err, decoded) => {
        if (err) {
          return res.json({
            status: 401,
            message: "Đường dẫn đã hết hạn.Vui lòng đăng ký lại",
            errors: [],
          });
        } else {
          await processDataActivation(jwt.decode(token), token);
        }
      });
    res.json({
      status: 200,
      message:
        "🎉 Chúng tôi đã tiếp nhận yêu cầu của Bạn.Vui lòng kiểm tra Email để xác nhận đăng ký thành công",
      errors: [],
    });
  } else {
    res.json({
      status: 401,
      message:
        "Tài khoản của Bạn đã được kích hoạt.Vui lòng đăng nhập",
      errors: [],
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
              buy_package: user.buy_package
            },
          },
          message: "Đăng nhập thành công",
          errors: [],
        });
      }
    });
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

  const user = await User.findOne({ email }).exec();

  if (!user) {
    res.json({
      status: 404,
      message: "Người dùng với email này không tồn tại",
      errors: [],
      data: {}
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
    const subject = `[AMERITEC] ĐƯỜNG DẪN CẤP LẠI MẬT KHẨU`;
    const html = `
                    <h1>Bấm vào link này để đổi mật khẩu</h1>
                    <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                    <hr />
                    <p>Mọi chi tiết vui lòng liên hệ : </p>
                    <p>${process.env.CLIENT_URL}</p>
                `;

    try {

      await Mail(email, html, subject);
      console.log("forgot pass sended!!!! to", email);

      await user.updateOne({
          resetPasswordLink: token,
        }).exec();

      return res.json({
        status: 200,
        message: `🎉 Mail đã được gửi đến ${email}`,
      });

    } catch (err) {
      console.log("error forgot pass mail!!!! to", email);
    }
  }
};

exports.resetPasswordController = async (req, res) => {
  const { newPassword, token } = req.body;

  const resetPasswordLink = token;

  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      async function (err, decoded) {
        if (err) {
          return res.json({
            status: 401,
            message: "Đường link đã hết hạn.Vui lòng thử lại"
          });
        }

        const user = await User.findOne({ resetPasswordLink }).exec();

        if (!user) {
          return res.json({
            status: 401,
            message: "Đường link đã hết hạn.Vui lòng thử lại"
          });
        } else {
          bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
            // Store hash in your password DB.
            const result = await User.findOneAndUpdate(
              { _id: user._id },
              {
                password: hash,
                resetPasswordLink: "",
              },
              {
                returnOriginal: false,
              }
            ).exec();

            if (!result) {
              return res.json({
                status: 401,
                message: "Lỗi khi update mật khẩu người dùng"
              });
            } else {
              return res.json({
                status: 200,
                message: "🎉 Tuyệt vời! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới của mình"
              });
            }
          });
        }
      }
    );
  }
};

const returnCommission = async (receive_mem, buy_package, join_mem) => {
  const bankAccountOfParent = await User.findOne({ _id: receive_mem }).exec();

  const commission = new Commission({
    receive_mem: bankAccountOfParent.full_name,
    bank_account: bankAccountOfParent.bank_account,
    bank: bankAccountOfParent.bank,
    bank_name: bankAccountOfParent.bank_name,
    amount: buy_package === "1" ? process.env.COMMISSION_PERSON : process.env.COMMISSION_PACKAGE,
    join_mem,
    created_time: new Date(),
    payment_method: "",
    active_admin: false,
    status: "pending",
    qualified: bankAccountOfParent.be_member,
  });

  await commission.save(function (err) {
    if (err) {
      console.log("error add commission", err);
    } else {
      console.log("saved commission");
    }
  });
};
