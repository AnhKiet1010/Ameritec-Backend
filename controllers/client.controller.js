const User = require("../models/user.model");
const Tree = require("../models/tree.model");
const Transaction = require("../models/transaction.model");
const Commission = require("../models/commission.model");
const bcrypt = require("bcrypt");
const {
  countTotalChildMemberForLevel,
  countTotalPersonPackage,
  getFullChildren,
  getData,
  countTotalChildMember,
} = require("./method");

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

exports.tree = async (req, res) => {
  const { id, search } = req.params;

  const searchUser = await User.findOne({ _id: search }).exec();

  const objBranch = await Tree.findOne({ parent: search })
    .select("group1 group2 group3")
    .exec();
  const { group1, group2, group3 } = objBranch;
  const arrObjectOfSearchUsers = [...group1, ...group2, ...group3];

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

  const listChildName = listChildNameBefore.map((child) => {
    return { value: child._id, label: child.full_name };
  });

  const result1 = await getData(group1);
  const result2 = await getData(group2);
  const result3 = await getData(group3);

  const root = [];
  root.push({
    _id: searchUser._id,
    avatar: searchUser.avatar,
    full_name: searchUser.full_name,
    countChild: await countTotalChildMember(arrObjectOfSearchUsers),
    level: searchUser.level,
    buy_package: searchUser.buy_package,
    child1: {
      arr: [...result1],
      countChild: await countTotalChildMember(result1),
    },
    child2: {
      arr: [...result2],
      countChild: await countTotalChildMember(result2),
    },
    child3: {
      arr: [...result3],
      countChild: await countTotalChildMember(result3),
    },
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

  if (errors.length > 0) {
    res.json({
      status: 401,
      message: "Có lỗi xảy ra!",
      errors
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
      be_member: "true"
    }).exec();

    res.json({
      status: 200,
      message: "Nâng cấp thành công.Vui lòng đăng nhập lại",
      errors: []
    });
  }
}

exports.profile = async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id })
    .select(
      "full_name phone birthday be_member gender id_code id_type id_time issued_by tax_code iden_type"
    )
    .exec();

  if (user.be_member) {
    res.json({
      status: 200,
      data: { user },
      errors: [],
      message: "",
    });
  } else {
    res.json({
      status: 200,
      data: {
        user: {
          full_name: user.full_name,
          phone: user.phone,
          birthday: user.birthday,
          gender: user.gender,
        },
      },
      errors: [],
      message: "",
    });
  }
};

exports.editProfile = async (req, res) => {
  const { values, id } = req.body;
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
  } = values;
  console.log('change gender', req.body.values.gender);
  console.log('id', id);

  const errors = [];

  const user = await User.findOne({ _id: id }).exec();
  console.log('user gender', user.gender);

  bcrypt.compare(password, user.password, async function (err, result) {
    // result == true
    if (!result || err) {
      return res.json({
        status: 400,
        errors,
        message: "Mật khẩu không đúng. Vui lòng thử lại"
      });
    } else {
      const valid_phone = await User.findOne({ $and: [{ phone: phone }, { _id: { $ne: id } }] }).exec();
      const valid_id_code = await User.findOne({ $and: [{ id_code: phone }, { _id: { $ne: id } }] }).exec();
      const valid_tax_code = await User.findOne({ $and: [{ tax_code: phone }, { _id: { $ne: id } }] }).exec();

      if (valid_phone) {
        if (JSON.stringify(valid_phone) !== JSON.stringify(user)) {
          errors.push({
            label: "phone",
            err_message: "Số điện thoại đã được sử dụng.Vui lòng chọn số khác",
          });
        }
      }
      if (valid_id_code) {
        if (JSON.stringify(valid_id_code) !== JSON.stringify(user)) {
          errors.push({
            label: "id_code",
            err_message: "Số CMND/Hộ chiếu đã được sử dụng",
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

      if (errors.length > 0) {
        res.json({
          status: 400,
          errors,
          message: "Có thông tin bị trùng.Vui lòng thử lại!"
        });
      } else {
        if (user.be_member) {
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
          if (change) {
            res.json({
              status: 200,
              message: "Cập nhật thông tin thành công 🎉",
              errors: [],
              data: {
                newUser: await User.findOne({ _id: id }).select("full_name phone birthday gender id_code,id_time,issued_by, tax_code,").exec(),
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
            res.json({
              status: 200,
              message: "Cập nhật thông tin thành công 🎉",
              errors: [],
              data: {
                newUser: await User.findOne({ _id: id }).select("full_name phone birthday gender").exec(),
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

exports.transaction = async (req, res) => {
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
