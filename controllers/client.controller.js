const User = require("../models/user.model");
const Tree = require("../models/tree.model");
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
  console.log("Nhóm 1", totalChildMemberGroup1);
  console.log("Nhóm 2", totalChildMemberGroup2);
  console.log("Nhóm 3", totalChildMemberGroup3);
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

  const errors = [];

  const user = await User.findOne({ _id: id }).exec();

  bcrypt.compare(password, user.password, async function (err, result) {
    // result == true
    if (!result || err) {
      errors.push({
        label: "password",
        err_message: "Mật khẩu không đúng. Vui lòng thử lại",
      });
      return res.json({
        status: 400,
        errors,
        message: "Mật khẩu không đúng. Vui lòng thử lại"
    });
    } else {
      const valid_phone = await User.findOne({ phone }).exec();
      const valid_id_code = await User.findOne({ id_code }).exec();
      const valid_tax_code = await User.findOne({ tax_code }).exec();

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
          await User.findOneAndUpdate(
            { _id },
            {
              full_name,
              phone,
              birthday,
              gender,
              id_code,
              id_time,
              issued_by,
              tax_code,
            }
          ).exec();
          res.json({
            status: 200,
            message: "Cập nhật thông tin thành công 🎉",
            errors: []
          });
        } else {
          await User.findOneAndUpdate(
            { _id },
            {
              full_name,
              phone,
            }
          ).exec();
          res.json({
            status: 200,
            message: "Cập nhật thông tin thành công 🎉",
            errors: []
          });
        }
      }
    }
  });
};
