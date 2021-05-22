const {
  checkoutNganLuong,
  callbackNganLuong,
} = require("./nganluong-handlers");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Tree = require("../models/tree.model");
const Commission = require("../models/commission.model");
const Activation = require("../models/activation.model");
const fs = require('fs');
const { thankMail, successMail } = require("./method");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require("bcrypt");

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
          activationLimit: 4,
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
        return links;
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

exports.checkout = async (req, res) => {
  const { email, payment_method, bank_code } = req.body;
  console.log('body', req.body);
  if (payment_method === "nganluong" || payment_method === "nganluongvisa") {

    const params = Object.assign({}, req.body);

    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    const amount = parseInt(params.total_amount.replace(/,/g, ""), 10);
    const now = new Date();

    // NOTE: only set the common required fields and optional fields from all gateways here, redundant fields will invalidate the payload schema checker
    const checkoutData = {
      amount,
      customerName: params.name,
      clientIp: clientIp.length > 15 ? "127.0.0.1" : clientIp,
      locale: "vn",
      billingCity: params.city || "",
      billingStateProvince: params.district || "",
      billingCountry: params.country || "",
      billingStreet: params.address || "",
      currency: "VND",
      customerEmail: params.email,
      customerPhone: params.phone,
      orderId: `Ameritec-${now.toISOString()}`,
      transactionId: `Ameritec-${now.toISOString()}`, // same as orderId (we don't have retry mechanism)
      customerId: params.email,
    };

    // pass checkoutData to gateway middleware via res.locals
    res.locals.checkoutData = checkoutData;

    // Note: these handler are asynchronous
    let asyncCheckout = null;
    switch (payment_method) {
      case "nganluong":
        // this param is not expected in other gateway
        checkoutData.customerName = `${params.name}`.trim();
        checkoutData.paymentMethod = "ATM_ONLINE";
        checkoutData.bankCode = bank_code;
        asyncCheckout = checkoutNganLuong(req, res);
        break;
      case "nganluongvisa":
        // this param is not expected in other gateway
        checkoutData.customerName = `${params.name}`.trim();
        checkoutData.paymentMethod = "VISA";
        asyncCheckout = checkoutNganLuong(req, res);
        break;
      default:
        break;
    }

    if (asyncCheckout) {
      asyncCheckout
        .then(async (checkoutUrl) => {
          console.log("checkoutUrl", checkoutUrl);

          await Transaction.findOneAndUpdate(
            { email },
            { payment_method }
          ).exec();
          res.json({
            status: 200,
            data: {
              checkoutUrl: checkoutUrl.href,
              payment_method
            }
          });
        })
        .catch((err) => {
          res.send(err.message);
        });
    } else {
      console.log("build checkout bị lỗi");

      res.json({
        status: 301,
        message: "Payment method not found",
        data: {
          payment_method,
        },
        errors: [],
      });
    }
  } else if (payment_method === "tienmat") {
    await Transaction.findOneAndUpdate(
      { email },
      { payment_method: "tienmat" }
    ).exec();
    res.json({
      status: 200,
      data: {
        payment_method,
      },
      message: "Trả bằng tiền mặt",
      errors: [],
    });
  }
};

async function processDataActivation(data, token) {

  const {
    full_name,
    email,
    password,
    phone,
    id_code,
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

      user.save(async function (err) {
        if (err) {
          unSavedErr.push({ field: "user" });
        } else {

          // --------------- FIND DONATE USER -------------------
          if (invite_code !== process.env.INVITE_CODE) {
            const userOfDonateSales = await User.findOne({
              _id: donate_sales_id,
            }).exec();

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
      if (invite_code !== process.env.INVITE_CODE) {

        const userOfInvite = await User.findOne({
          _id: invite_code,
        }).exec();

        await User.findOneAndUpdate(
          { _id: invite_code },
          {
            amount:
              buy_package === "1"
                ? userOfInvite.amount + 40
                : userOfInvite.amount + 160,
          }
        ).exec();
      }

      // --------------- UPDATE LEVEL PARENT -------------------
      if (invite_code !== process.env.INVITE_CODE) {
        updateParent(invite_code, buy_package);
      }

      // --------------- SAVE COMMISSTIONS -------------------
      if (invite_code !== process.env.INVITE_CODE) {
        returnCommission(
          invite_code,
          buy_package,
          full_name
        );
      }

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
      if (invite_code !== process.env.INVITE_CODE) {
        const userOfInvite = await User.findOne({
          _id: invite_code,
        }).exec();
        thankMail(
          userOfInvite.full_name,
          userOfInvite.email,
          full_name
        );
      }
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

exports.callback = async (req, res) => {
  const gateway = req.params.gateway;
  console.log("gateway", req.params.gateway);
  let asyncFunc = null;

  switch (gateway) {
    case "nganluong":
      asyncFunc = callbackNganLuong(req, res);
      break;
    default:
      break;
  }

  if (asyncFunc) {
    await asyncFunc.then(async () => {
      const title = `${gateway.toUpperCase()}`;
      const isSucceed = res.locals.isSucceed;
      const email = res.locals.email;
      const orderId = res.locals.orderId;
      const price = res.locals.price;
      const message = res.locals.message;
      if (isSucceed) {
        const trans = await Transaction.findOne({ email: res.locals.email }).exec();

        const { token, email } = trans;

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

        await Transaction.findOneAndUpdate({ email }, { status: "success" }).exec();


        return res.redirect(
          `${process.env.CLIENT_URL}/pay-success/${isSucceed}/${title}/${email}/${orderId}/${price}/${message}`
        );
      }
    });
  } else {
    res.send("No callback found");
  }
};

exports.cancel = async (req, res) => {
  res.redirect(process.env.CLIENT_URL);
};
