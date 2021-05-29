const User = require("../models/user.model");
const Tree = require("../models/tree.model");
const Transaction = require("../models/transaction.model");
const Commission = require("../models/commission.model");
const Activation = require("../models/activation.model");
const Policy = require("../models/policy.model");
const { PROVINCES } = require("../constants/province");
const { BANK } = require("../constants/bank");
const axios = require("axios");
const bcrypt = require("bcrypt");
const {
  countTotalChildMemberForLevel,
  countTotalPersonPackage,
  getFullChildren,
  countTotalChildMember,
  randomString,
  upgradeMail
} = require("./method");
const fs = require('fs');

exports.dashboard = async (req, res) => {
  const { id } = req.params;
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
  res.json({
    status: 200,
    data: {
      user,
      totalGroup1: totalChildMemberGroup1,
      totalGroup2: totalChildMemberGroup2,
      totalGroup3: totalChildMemberGroup3,
      totalPersonPackage,
      targetNumber: parseInt(targetNumber),
    },
    errors: [],
  });
};

const getListChildId = async (id) => {
  const objBranch = await Tree.findOne({ parent: id })
    .select("group1 group2 group3")
    .exec();

  const { group1, group2, group3 } = objBranch;

  return [...group1, ...group2, ...group3];
};

const getTreeChild = async (idcha) => {
  var userCha = await User.findOne({ _id: idcha })
    .exec();
  var listCon = await Tree.findOne({ parent: idcha })
    .select("group1 group2 group3")
    .exec();
  var child1 = [];
  var child2 = [];
  var child3 = [];
  if (listCon) {
    for (const element of listCon.group1) {
      await child1.push(await getTreeChild(element));
    }
    for (const element of listCon.group2) {
      await child2.push(await getTreeChild(element));
    }
    for (const element of listCon.group3) {
      await child3.push(await getTreeChild(element));
    }
  }
  var Cha = {
    _id: userCha._id,
    full_name: userCha.full_name,
    countChild: await countTotalChildMember(await getListChildId(idcha)),
    level: userCha.level,
    buy_package: userCha.buy_package,
    avatar: userCha.avatar,
    child1: {
      arr: child1,
      countChild: await countTotalChildMember(child1)
    },
    child2: {
      arr: child2,
      countChild: await countTotalChildMember(child2)
    },
    child3: {
      arr: child3,
      countChild: await countTotalChildMember(child3)
    },
  };
  return Cha;
}

exports.tree = async (req, res) => {
  const { id, search } = req.params;

  const objBranchChild = await Tree.findOne({ parent: id })
    .select("group1 group2 group3")
    .exec();
  const listChildNameBefore = await getFullChildren(
    [
      ...objBranchChild.group1,
      ...objBranchChild.group2,
      ...objBranchChild.group3,
    ],
    []
  );

  const result = await getTreeChild(search);
  const root = [];
  root.push(result);

  const listChildName = listChildNameBefore.map((child) => {
    return { value: child._id, label: child.full_name };
  });

  res.json({
    status: 200,
    data: {
      listChildName,
      group: root,
    },
    errors: [],
    message: "",
  });
};

const getActiveLink = async (email, full_name, phone) => {
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

  for (let i = 1; i <= 3; i++) {
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
  return links;
};

exports.upgrade = async (req, res) => {
  const {
    user_id,
    id_code,
    id_time,
    issued_by,
    bank,
    bank_account,
    bank_name,
    tax_code
  } = req.body;

  var errors = [];

  var cmndMT = "";
  var cmndMS = "";

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

  if (errors.length > 0) {
    res.json({
      status: 401,
      message: "Có lỗi xảy ra!",
      errors
    });
  } else {
    const user = await User.findOne({ _id: user_id }).exec();


    if (user.buy_package == "1") {
      const links = await getActiveLink(user.email, user.full_name, user.phone);
      upgradeMail(user.full_name, user.email, user.phone, links);

      await User.findOneAndUpdate({ _id: user_id }, {
        id_code,
        id_time,
        issued_by,
        bank,
        bank_account,
        bank_name,
        tax_code,
        buy_package: "2",
        cmndMT,
        cmndMS
      }).exec();

      const parentUser = await User.findOne({ _id: user.parentId }).exec();

      if (user.parentId !== process.env.INVITE_CODE) {
        await User.findOneAndUpdate({ _id: parentUser._id }, { amount: parentUser.amount + 120 }).exec();
      }

      // --------------- UPDATE LEVEL PARENT -------------------

      updateParent(parentUser._id, user.buy_package);

      res.json({
        status: 200,
        message: "Nâng cấp thành công.Vui lòng đăng nhập lại! Link kích hoạt APP đã được gửi đến Email của Bạn",
        errors: []
      });
    } else {
      await User.findOneAndUpdate({ _id: user_id }, {
        id_code,
        id_time,
        issued_by,
        bank,
        bank_account,
        bank_name,
        tax_code,
        buy_package: "2",
        cmndMT,
        cmndMS
      }).exec();

      res.json({
        status: 200,
        message: "Nâng cấp thành công.Vui lòng đăng nhập lại",
        errors: []
      });
    }
  }
}

const updateParent = async (id, buy_package) => {
  const parent = await User.findOne({ _id: id }).exec();
  const checkUp = await checkUpLevel(id, buy_package);

  await User.findOneAndUpdate(
    { _id: parent._id },
    {
      point: parent.point + 0.75,
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

exports.profile = async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id }).exec();

  res.json({
    status: 200,
    data: {
      user,
      result: user.buy_package === "2" ? [
        { label: "Họ và tên", value: user.full_name },
        { label: "Giới tính", value: user.gender === 2 ? "Nam" : user.gender === 3 ? "Nữ" : "N/A" },
        { label: "Ngày tháng năm sinh", value: user.birthday ? new Date(user.birthday).toLocaleDateString("vi").split(",")[0] : "" },
        { label: "Email", value: user.email },
        { label: "Số điện thoại", value: user.phone },
        { label: "Số chứng minh thư", value: user.id_code },
        { label: "Ngày cấp", value: user.id_code ? new Date(user.id_time).toLocaleDateString("vi").split(",")[0] : "" },
        { label: "Nơi cấp", value: PROVINCES.find(pro => pro.value === user.issued_by).label },
        { label: "Số tài khoản", value: user.bank_account },
        { label: "Ngân hàng", value: BANK.find(b => b.value === user.bank).label },
        { label: "Tên tài khoản", value: user.bank_name },
        { label: "cmndMT", value: user.cmndMT },
        { label: "cmndMS", value: user.cmndMS },
      ] : [
        { label: "Họ và tên", value: user.full_name },
        { label: "Email", value: user.email },
        { label: "Số điện thoại", value: user.phone },
      ]

    },
    errors: [],
    message: ""
  });
};

exports.editProfile = async (req, res) => {
  const {
    full_name,
    phone,
    birthday,
    gender,
    id_code,
    id_time,
    issued_by,
    tax_code,
    password,
    bank,
    bank_account,
    bank_name,
    id
  } = req.body;

  const errors = [];

  const user = await User.findOne({ _id: id }).exec();

  bcrypt.compare(password, user.password, async function (err, result) {
    // result == true
    if (!result || err) {
      return res.json({
        status: 400,
        errors,
        message: "Mật khẩu không đúng. Vui lòng thử lại"
      });
    } else {
      const valid_phone = await User.findOne({ $and: [{ phone }, { _id: { $ne: id } }] }).exec();

      if (valid_phone) {
        if (JSON.stringify(valid_phone) !== JSON.stringify(user)) {
          errors.push({
            label: "phone",
            err_message: "Số điện thoại đã được sử dụng.Vui lòng chọn số khác",
          });
        }
      }

      if (user.buy_package === "2") {
        const valid_id_code = await User.findOne({ $and: [{ id_code }, { _id: { $ne: id } }] }).exec();
        const valid_tax_code = await User.findOne({ $and: [{ tax_code }, { _id: { $ne: id } }, { tax_code: { $ne: "" } }] }).exec();

        if (valid_id_code) {
          if (JSON.stringify(valid_id_code) !== JSON.stringify(user)) {
            errors.push({
              label: "id_code",
              err_message: "Số CMND đã được sử dụng",
            });
          }
        }
        if (valid_tax_code) {
          if (JSON.stringify(valid_tax_code) !== JSON.stringify(user)) {
            errors.push({
              label: "tax_code",
              err_message: "Mã số thuế đã được sử dụng",
            });
          }
        }
      }

      if (errors.length > 0) {
        res.json({
          status: 400,
          errors,
          message: "Có thông tin bị trùng.Vui lòng thử lại!"
        });
      } else {
        if (user.buy_package === "2") {
          let change = false;
          if (user.full_name !== full_name) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                full_name,
              }
            ).exec();
            change = true;
          }
          if (user.phone !== phone) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                phone,
              }
            ).exec();
            change = true;
          }
          if (user.birthday !== birthday) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                birthday,
              }
            ).exec();
            change = true;
          }
          if (user.gender !== gender) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                gender: gender,
              }
            ).exec();
            change = true;
          }
          if (user.id_code !== id_code) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                id_code,
              }
            ).exec();
            change = true;
          }
          if (user.id_time !== id_time) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                id_time,
              }
            ).exec();
            change = true;
          }
          if (user.issued_by !== issued_by) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                issued_by,
              }
            ).exec();
            change = true;
          }
          if (user.tax_code !== tax_code) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                tax_code,
              }
            ).exec();
            change = true;
          }
          if (user.bank !== bank) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                bank,
              }
            ).exec();
            change = true;
          }
          if (user.bank_account !== bank_account) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                bank_account,
              }
            ).exec();
            change = true;
          }
          if (user.bank_name !== bank_name) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                bank_name,
              }
            ).exec();
            change = true;
          }

          const files = req.files;

          if (files.CMND_Front && files.CMND_Back) {
            var cmndMT = "";
            var cmndMS = "";
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
            await User.findOneAndUpdate(
              { _id: id },
              {
                cmndMT,
                cmndMS
              }
            ).exec();
            change = true;
          }


          if (change) {

            await User.findOneAndUpdate(
              { _id: id },
              {
                changeDataBy: "USER",
              }
            ).exec();

            res.json({
              status: 200,
              message: "Cập nhật thông tin thành công 🎉",
              errors: [],
              data: {
                newUser: await User.findOne({ _id: id }).exec(),
                change
              }
            });
          } else {
            res.json({
              status: 200,
              message: "Thông tin không thay đổi",
              errors: []
            });
          }
        } else {
          let change = false;
          if (user.full_name !== full_name) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                full_name,
              }
            ).exec();
            change = true;
          }
          if (user.phone !== phone) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                phone,
              }
            ).exec();
            change = true;
          }
          if (user.birthday !== birthday) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                birthday,
              }
            ).exec();
            change = true;
          }
          if (user.gender !== gender) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                gender: gender,
              }
            ).exec();
            change = true;
          }
          if (change) {
            await User.findOneAndUpdate(
              { _id: id },
              {
                changeDataBy: "USER",
              }
            ).exec();

            res.json({
              status: 200,
              message: "Cập nhật thông tin thành công 🎉",
              errors: [],
              data: {
                newUser: await User.findOne({ _id: id }).exec(),
                change
              }
            });
          } else {
            res.json({
              status: 200,
              message: "Thông tin không thay đổi",
              errors: []
            });
          }
        }
      }
    }
  });
};

exports.policy = async (req, res) => {
  const { id } = req.params;

  const listPolicy = await Policy.find({}).sort({ _id: -1 }).exec();
  const newPolicy = listPolicy[0];

  await User.findOneAndUpdate({ _id: id }, { readPolicy: true }).exec();

  res.json({
    status: 200,
    errors: [],
    data: newPolicy
  });
}

exports.inviteUrl = async (req, res) => {
  const { id } = req.body;

  const objBranchChild = await Tree.findOne({ parent: id })
    .select("group1 group2 group3")
    .exec();

  const listChildNameBefore = await getFullChildren(
    [
      ...objBranchChild.group1,
      ...objBranchChild.group2,
      ...objBranchChild.group3,
    ],
    []
  );

  const listChildName = [{ id: "", value: "" }, ...listChildNameBefore.map((child) => {
    return { value: child._id, label: child.full_name };
  })];

  res.json({
    status: 200,
    data: {
      listChildName
    },
    message: "",
    errors: []
  });
}

exports.receipts = async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id }).exec();
  const transaction = await Transaction.find({ email: user.email, status: 'success' }).exec();
  const commission = await Commission.find({ receive_mem: id }).sort({ _id: -1 }).exec();

  res.json({
    status: 200,
    data: {
      transaction,
      commission
    },
    message: "",
    errors: []
  });
}
