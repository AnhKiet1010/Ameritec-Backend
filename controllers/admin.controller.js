const User = require("../models/user.model");
const Activations = require("../models/activation.model");
const Tree = require("../models/tree.model");
const Transaction = require("../models/transaction.model");
const { PROVINCES } = require("../constants/province");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const saltRounds = 10;

exports.getUserExpired = async (req, res,) => {
  var list = await User.find({ expired: true }).exec();
  res.json({
    status: 200,
    data: list,
    errors: [],
  });
};

exports.helperInsert = async (req, res,) => {

  var listSugarDaddies = req.body.listSugarDaddy;
  var listdoanhnghieps = req.body.listGoiDoanhNghiep;
  var listdoanhnghiep = listdoanhnghieps.split(",");
  var list = await User.find({ id_ameritecjsc: { $ne: null } }).exec();
  // return res.json({
  //   status: 200,
  //   errors: [listSugarDaddies.filter(({ meta_value }) => meta_value == '1')],
  // });
  for (const element of list) {
    //tạo tree
    var treeElement = await Tree.findOne({ parent: element._id }).exec();
    if (!treeElement) {
      const listSugarDaddy = listSugarDaddies.filter(({ meta_value }) => meta_value == element.id_ameritecjsc);
      const groupcon = [];
      for (const sugar of listSugarDaddy) {
        const usercon = await User.findOne({ id_ameritecjsc: sugar.user_id }).exec();
        if (usercon != null) {
          groupcon.push(usercon._id);
        }
      }
      const tree = new Tree({
        group1: groupcon,
        group2: [],
        group3: [],
        parent: element._id,
        buy_package: listdoanhnghiep.includes(element.user_login) ? "1" : "2"
      });
      await tree.save(function (err) {
        if (err) {
          console.log("fail to save tree!");
        }
      });
    }
    else {
      const listSugarDaddy = listSugarDaddies.filter(({ meta_value }) => meta_value == element.id_ameritecjsc);
      const groupcon = [];
      for (const sugar of listSugarDaddy) {
        const usercon = await User.findOne({ id_ameritecjsc: sugar.user_id }).exec();
        if (usercon != null) {
          groupcon.push(usercon._id);
        }
      }
      treeElement.group1 = groupcon;
      treeElement.buy_package = listdoanhnghiep.includes(element.user_login) ? "1" : "2";
      if (element.id_ameritecjsc === '1') {

      }
      await treeElement.save(function (err) {
        if (err) {
          console.log("fail to update tree!");
        }
      });
    }
    //tạo transaction
    var transElement = await Transaction.findOne({ email: element.email }).exec();
    if (!transElement) {
      const paramdate = new Date(element.user_registered);
      const transaction = new Transaction({
        token: "",
        status: "success",
        created_time: paramdate,
        approved_by: "ameritecjsc",
        approved_time: paramdate,
        created_by: element.full_name,
        email: element.email,
        payment_method: "tienmat",
        phone: "no have",
        buy_package: listdoanhnghiep.includes(element.user_login) ? "1" : "2",
        expired_time: new Date(paramdate.getFullYear() + 1, paramdate.getMonth(), paramdate.getDay(), paramdate.getHours(), paramdate.getMinutes(), paramdate.getMilliseconds())
      });
      await transaction.save(function (err) {
        if (err) {
          console.log("fail to save transaction!");
        }
      });
    }
    else {
      transElement.buy_package = listdoanhnghiep.includes(element.user_login) ? "1" : "2";
      await transElement.save(function (err) {
        if (err) {
          console.log("fail to update transaction!");
        }
      });
    }

    //làm mịn data
    element.password = "$2b$10$3HpEWjLCqQ97bg7cIuPP/OMOyr5kkzQ7zxZTczdXJH2STQPYwiA0m";
    element.avatar = "https://robohash.org/doloresutqui?size=100x100&set=set1";
    element.role = "normal";
    element.created_time = new Date(element.user_registered);
    element.buy_package = listdoanhnghiep.includes(element.user_login) ? "1" : "2";
    element.be_member = true;
    element.full_name = element.display_name;
    element.expired = false;
    const father = listSugarDaddies.filter(({ user_id }) => user_id == element.id_ameritecjsc);

    if (father[0] != null) {
      const userfather = await User.findOne({ id_ameritecjsc: father[0].meta_value }).exec();

      if (userfather) {
        element.parentId = userfather._id;
      }
      else {
        element.parentId = "AMERITEC2021";
      }
    }
    else {
      element.parentId = "AMERITEC2021";
    }
    // User.findByIdAndUpdate(element._id, {
    //   $set:
    //   {
    //     password: element.password,
    //     avatar: element.avatar,
    //     role: element.role,
    //     created_time: element.created_time,
    //     buy_package: element.buy_package,
    //     be_member: element.be_member,
    //     full_name: element.full_name,
    //     expired: element.expired,
    //     parentId: element.parentId
    //   }
    // }, { new: true }, function (err, updatedDocument) {
    //   element.save();
    // });
    await element.save(function (err) {
      if (err) {
        console.log("fail to update user: " + element.id_ameritecjsc);
      }
    });
  };
  res.json({
    status: 200,
    errors: ["hi"],
  });
};

const countTotalChildMember = async (subTreeIdList) => {
  var count = subTreeIdList.length;

  for (let i = 0; i < subTreeIdList.length; i++) {
    let branchObject = await Tree.findOne({ parent: subTreeIdList[i]._id })
      .select("group1 group2 group3")
      .exec();

    if (branchObject) {
      let group = [
        ...branchObject.group1,
        ...branchObject.group2,
        ...branchObject.group3,
      ];
      if (group.length !== 0) {
        count += await countTotalChildMember(group);
      } else {
        continue;
      }
    } else {
      continue;
    }
  }
  return count;
};

exports.postLogin = async (req, res) => {
  const { acc, password } = req.body;

  Admin.findOne({ email: acc }).exec((err, user) => {
    if (err || !user) {
      return res.json({
        success: false,
        errors: [
          {
            label: "acc",
            err_message: "Email không hợp lệ",
          },
        ],
      });
    }
    if (password !== user.password) {
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
        avatar: "https://pickaface.net/gallery/avatar/jquan0755a199bfcb71d.png",
        full_name: user.full_name,
        role: user.role,
      },
    });
  });
};

const countTotalPersonPackage = async () => {
  var count = 0;
  let arr = await User.find().select("buy_package").exec();
  for (let user of arr) {
    if (user.buy_package === "1") {
      count++;
    } else {
      continue;
    }
  }
  return count;
};

const countTotalBusinessPackage = async () => {
  var count = 0;
  let arr = await User.find().select("buy_package").exec();
  for (let user of arr) {
    if (user.buy_package === "2") {
      count++;
    } else {
      continue;
    }
  }
  return count;
};

exports.getDashboard = async (req, res) => {
  //const { id } = req.params;
  //try {
  const filter = req.query.filterCode;
  const countPersonPackages = await countTotalPersonPackage();
  const countBusinessPackages = await countTotalBusinessPackage();
  const date = new Date();
  var listUser = await User.find({ role: { $ne: "admin" } }).sort({ _id: -1 }).exec();
  listUser.forEach(element => {
    element.created_time = new Date(element.created_time);
  });
  var kq = [];
  switch (filter) {
    case '1':
      for (let i = 0; i < listUser.length; i++) {
        if (new Date(listUser[i].created_time) > new Date(date.getFullYear(), date.getMonth(), date.getDate())) {
          kq.push(listUser[i]);
        }
      }
      break;
    case '2':
      for (let i = 0; i < listUser.length; i++) {
        if (new Date(listUser[i].created_time) > new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)) {
          kq.push(listUser[i]);
        }
      }
      break;
    case '3':
      for (let i = 0; i < listUser.length; i++) {
        if (new Date(listUser[i].created_time) > new Date(date.getFullYear(), date.getMonth() - 1, date.getDate())) {
          kq.push(listUser[i]);
        }
      }
      break;
    case '4':
      for (let i = 0; i < listUser.length; i++) {
        if (new Date(listUser[i].created_time) > new Date(date.getFullYear() - 1, date.getMonth(), date.getDate() - 7)) {
          kq.push(listUser[i]);
        }
      }
      break;
  }

  res.json({
    status: 200,
    data: {
      countPersonPackages,
      countBusinessPackages,
      listUserFilter: kq,
    },
    errors: [],
    message: ""
  });
  //} catch (error) {
  //   res.json({
  //     status: 500,
  //     data: {

  //     },
  //     errors: "Something wrong!!!",
  //     message: ""
  //   });
  // }

};

exports.getUser = async (req, res) => {
  const { id } = req.params;
  console.log("id", id);

  var user = await User.findOne({ role: { $ne: "admin" }, _id: id }).exec();
  if (user == null) {
    return res.json({
      status: 404,
      errors: ["Not Found The User"],
    });
  }

  res.json({
    status: 200,
    data: {
      result: user.be_member ? [
        { label: "Họ và tên", value: user.full_name },
        { label: "Email", value: user.email },
        { label: "Số điện thoại", value: user.phone },
        { label: "Giới tính", value: user.gender === 1 ? "Nam" : user.gender === 2 ? "Nữ" : "N/A" },
        { label: "Ngày tháng năm sinh", value: new Date(user.birthday).toLocaleDateString("vi").split(",")[0] },
        { label: "Số chứng minh thư", value: user.id_code },
        { label: "Ngày cấp", value: new Date(user.id_time).toLocaleDateString("vi").split(",")[0] },
        { label: "Nơi cấp", value: PROVINCES.find(pro => pro.value === user.issued_by).label },
        { label: "Số tài khoản", value: user.bank_account },
        { label: "Ngân hàng", value: user.bank },
        { label: "Tên tài khoản", value: user.bank_name },
      ] : [
        { label: "Họ và tên", value: user.full_name },
        { label: "Email", value: user.email },
        { label: "Số điện thoại", value: user.phone },
        { label: "Giới tính", value: user.gender === 1 ? "Nam" : user.gender === 2 ? "Nữ" : "N/A" },
        { label: "Ngày tháng năm sinh", value: new Date(user.birthday).toLocaleDateString("vi").split(",")[0] },
      ]

    },
    errors: [],
    message: ""
  });

}

exports.getStorage = async (req, res) => {
  const { filterCode } = req.query;

  const date = new Date();
  var listLink = await Activations.find().sort({ _id: -1 }).exec();
  listLink.forEach(element => {
    element.created = new Date(element.created);
  });
  var kq = [];
  switch (filterCode) {
    case '1':
      for (let i = 0; i < listLink.length; i++) {
        if (new Date(listLink[i].created) > new Date(date.getFullYear(), date.getMonth(), date.getDate())) {
          kq.push(listLink[i]);
        }
      }
      break;
    case '2':
      for (let i = 0; i < listLink.length; i++) {
        if (new Date(listLink[i].created) > new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)) {
          kq.push(listLink[i]);
        }
      }
      break;
    case '3':
      for (let i = 0; i < listLink.length; i++) {
        if (new Date(listLink[i].created) > new Date(date.getFullYear(), date.getMonth() - 1, date.getDate())) {
          kq.push(listLink[i]);
        }
      }
      break;
    case '4':
      for (let i = 0; i < listLink.length; i++) {
        if (new Date(listLink[i].created) > new Date(date.getFullYear() - 1, date.getMonth(), date.getDate())) {
          kq.push(listLink[i]);
        }
      }
      break;
  }

  res.json({
    status: 200,
    data: {
      listLinkFilter: kq,
    },
    errors: [],
    message: ""
  })

}

exports.getPendingList = async (req, res) => {
  const listTrans = await Transaction.find({ status: "pending" }).sort().exec();

  res.json({
    status: 200,
    data: {
      listTrans,
    },
    message: "",
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

const getData = async (group, parentIn) => {
  let kq = [];

  for (let i of group) {
    let parent = await User.findOne({ _id: i })
      .select(
        "full_name child1 child2 child3 countChild avatar groupNumber level buy_package"
      )
      .exec();
    let listGroup = await getListChildId(parent._id);
    if (listGroup.length > 0) {
      for (let id of listGroup) {
        let child = await User.findOne({ _id: id })
          .select(
            "full_name child1 child2 child3 countChild avatar groupNumber level buy_package"
          )
          .exec();
        if (child.groupNumber === "1") {
          parent.child1.arr.push(child);
          parent.child1.countChild = await countTotalChildMember(
            parent.child1.arr.map((item) => item._id)
          );
        } else if (child.groupNumber === "2") {
          parent.child2.arr.push(child);
          parent.child2.countChild = await countTotalChildMember(
            parent.child2.arr.map((item) => item._id)
          );
        } else if (child.groupNumber === "3") {
          parent.child3.arr.push(child);
          parent.child3.countChild = await countTotalChildMember(
            parent.child3.arr.map((item) => item._id)
          );
        }
        let listGroupOfChild = await getListChildId(child._id);
        parent.countChild = await countTotalChildMember(listGroup);
        child.countChild = await countTotalChildMember(listGroupOfChild);
        await getData(listGroupOfChild, child);
      }
      if (parentIn) {
        if (parent.groupNumber === "1") {
          parentIn.child1.arr.push(parent);
          parentIn.child1.countChild = await countTotalChildMember(
            parentIn.child1.arr.map((item) => item._id)
          );
        } else if (parent.groupNumber === "2") {
          parentIn.child2.arr.push(parent);
          parentIn.child2.countChild = await countTotalChildMember(
            parentIn.child2.arr.map((item) => item._id)
          );
        } else if (parent.groupNumber === "3") {
          parentIn.child3.arr.push(parent);
          parentIn.child3.countChild = await countTotalChildMember(
            parentIn.child3.arr.map((item) => item._id)
          );
        }
      } else {
        kq.push(parent);
      }
    } else {
      if (parentIn) {
        if (parent.groupNumber === "1") {
          parentIn.child1.arr.push(parent);
          parentIn.child1.countChild = await countTotalChildMember(
            parentIn.child1.arr.map((item) => item._id)
          );
        } else if (parent.groupNumber === "2") {
          parentIn.child2.arr.push(parent);
          parentIn.child2.countChild = await countTotalChildMember(
            parentIn.child2.arr.map((item) => item._id)
          );
        } else if (parent.groupNumber === "3") {
          parentIn.child3.arr.push(parent);
          parentIn.child3.countChild = await countTotalChildMember(
            parentIn.child3.arr.map((item) => item._id)
          );
        }
      } else {
        kq.push(parent);
      }
      continue;
    }
  }
  return kq;
};

const getTreeOfOneAgency = async (searchId) => {
  const searchUser = await User.findOne({ _id: searchId }).exec();

  const objBranch = await Tree.findOne({ parent: searchId })
    .select("group1 group2 group3")
    .exec();
  const { group1, group2, group3 } = objBranch;
  const arrObjectOfSearchUsers = [...group1, ...group2, ...group3];

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
  return root;
};

exports.getTree = async (req, res) => {
  const { id, search } = req.params;
  var listAgency = [];
  const invite_code = process.env.INVITE_CODE;

  if (id === search) {
    listAgency = [... (await User.find({ parentId: invite_code }).exec())];
  } else {
    listAgency = [... (await User.find({ _id: search }).exec())];
  }

  const listAllUser = await User.find({ role: { $ne: 'admin' } }).select("full_name").exec();

  const listChildName = listAllUser.map((child) => {
    return { value: child._id, label: child.full_name };
  });

  const root = [];

  for (let agency of listAgency) {
    const tree = await getTreeOfOneAgency(agency._id);
    if (tree.length === 0) {
      root.push([agency]);
    } else {
      root.push(tree);
    }

  }
  res.json({
    status: 200,
    data: {
      listChildName, group: root
    },
    errors: [],
    message: ""
  });
};

exports.createAdmin = async (req, res) => {
  console.log("body", req.body);
  var errors = [];
  const { email, phone, password, full_name } = req.body;
  var validUserEmail = await User.findOne({ email }).exec();
  var validUserPhone = await User.findOne({ phone }).exec();

  if (validUserEmail) {
    errors.push({ label: "email", err_message: "Email đã được sử dụng" });
  }

  if (validUserPhone) {
    errors.push({ label: "phone", err_message: "Số điện thoại đã được sử dụng" });
  }


  if (errors.length === 0) {

    const listCharacterOfName = full_name.split(" ");
    const avatarKey = `${listCharacterOfName[listCharacterOfName.length - 2]}+${listCharacterOfName[listCharacterOfName.length - 1]}`;

    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        if (err) {
          console.log(err);
          return res.json(err);
        } else {
          const user = new User({
            full_name,
            email,
            phone,
            password: hash,
            point: 0,
            level: 0,
            amount: 0,
            avatar: `https://ui-avatars.com/api/?name=${avatarKey}&background=random`,
            role: "admin",
            parentId: "AMERITEC",
            be_member: true
          });

          user.save((err) => {
            if (err) {
              console.log(err);
            } else {
              res.json({
                status: 200,
                errors: [],
                data: {},
                message: "Đã Admin thành công"
              });
            }
          })
        }
      });
    });
  }
  else {
    res.json({
      status: 401,
      errors,
      message: "Có lỗi xảy ra!"
    });
  }
}

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, role: 'admin' };
    const update = req.body;
    await User.findOneAndUpdate(filter, update);
    const user = await User.findOne(filter);
    res.json({
      status: 200,
      data: {
        user
      },
      errors: [],
      message: ""
    });
  } catch (error) {
    res.status(500).json({
      errors: error.message,
      message: ""
    });
  }

}

exports.editTree = async (req, res) => {
  const { values } = req.body;
  const { move_acc, root_acc } = values;

  const arr = root_acc.split("/");

  const invite_code = arr[arr.length - 2];

  const group = arr[arr.length - 1];

  const moveItem = await User.findOne({
    $or: [{ email: move_acc }, { phone: move_acc }],
  })
    .select("_id")
    .exec();
  const rootItem = await User.findOne({ phone: invite_code })
    .select("_id")
    .exec();

  if (!moveItem) {
    return res.json({
      success: false,
      errors: [
        {
          label: "move_acc",
          err_message: "Không tìm thấy tài khoản cần di chuyển.Kiểm tra lại",
        },
      ],
    });
  }

  if (!rootItem) {
    return res.json({
      success: false,
      errors: [
        {
          label: "root_acc",
          err_message: "Không tìm thấy tài khoản cần di chuyển.Kiểm tra lại",
        },
      ],
    });
  }

  const allTree = await Tree.find({ parent: { $ne: moveItem._id } }).exec();

  if (moveItem.ParentId === rootItem._id) {
    return res.json({
      success: false,
      errors: [
        {
          label: "root_acc",
          err_message: "Địa chỉ chuyển đi không thay đổi.Xác nhận lại",
        },
        {
          label: "move_acc",
        },
      ],
    });
  }

  if (!rootItem) {
    return res.json({
      success: false,
      errors: [
        {
          label: "root_acc",
          err_message: "Không tìm thấy tài khoản cần chuyển đến.Kiểm tra lại",
        },
      ],
    });
  }

  await User.findOneAndUpdate({ _id: moveItem._id }, { groupNumber: group });
  for (let tree of allTree) {
    const arrTreeGroup1 = tree.group1;
    const arrTreeGroup2 = tree.group2;
    const arrTreeGroup3 = tree.group3;

    if (arrTreeGroup1.length > 0) {
      const result = removeFromArr(arrTreeGroup1, moveItem._id);
      if (result) {
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group1: [...result] }
        ).exec();
        await User.findOneAndUpdate(
          { _id: moveItem._id },
          { parentId: rootItem._id }
        ).exec();
        await updateRootTreeGroup(group, rootItem, moveItem, res);
        return;
      }
    }

    if (arrTreeGroup2.length > 0) {
      const result = removeFromArr(arrTreeGroup2, moveItem._id);
      if (result) {
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group2: [...result] }
        ).exec();
        await User.findOneAndUpdate(
          { _id: moveItem._id },
          { parentId: rootItem._id }
        ).exec();
        await updateRootTreeGroup(group, moveItem, rootItem, res);
        return;
      }
    }

    if (arrTreeGroup3.length > 0) {
      const result = removeFromArr(arrTreeGroup3, moveItem._id);
      if (result) {
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group3: [...result] }
        ).exec();
        await User.findOneAndUpdate(
          { _id: moveItem._id },
          { parentId: rootItem._id }
        ).exec();
        await updateRootTreeGroup(group, rootItem, moveItem, res);
        return;
      }
    }
  }
};

exports.changeTree = async (req, res) => {
  const { values } = req.body;
  const { acc1, acc2 } = values;

  const user1 = await User.findOne({
    $or: [{ email: acc1 }, { phone: acc1 }],
  }).exec();

  const user2 = await User.findOne({
    $or: [{ email: acc2 }, { phone: acc2 }],
  }).exec();

  if (!user1 || !user2) {
    return res.json({
      success: false,
      errors: [
        {
          label: "acc1",
          err_message: "Email hoặc SĐT không hợp lệ",
        },
        {
          label: "acc2",
          err_message: "Email hoặc SĐT không hợp lệ",
        },
      ],
    });
  }
  const infoUser1 = {
    amount: user1.amount,
    level: user1.level,
    point: user1.point,
    groupNumber: user1.groupNumber,
    parentId: user1.parentId,
  };
  const infoUser2 = {
    amount: user2.amount,
    level: user2.level,
    point: user2.point,
    groupNumber: user2.groupNumber,
    parentId: user2.parentId,
  };

  await User.findOneAndUpdate({ _id: user1._id }, { ...infoUser2 }).exec();
  await User.findOneAndUpdate({ _id: user2._id }, { ...infoUser1 }).exec();

  // update parent in group
  if (user1.parentId !== "" && user2.parentId !== "") {
    if (
      user1.parentId === user2.parentId &&
      user1.groupNumber === user2.groupNumber
    ) {
      const tree = await Tree.findOne({ parent: user1.parentId }).exec();
      const arrGroup1 = tree.group1;
      const arrGroup2 = tree.group2;
      const arrGroup3 = tree.group3;

      if (user1.groupNumber === "1") {
        var i1 = arrGroup1.indexOf(user1._id);
        var i2 = arrGroup1.indexOf(user2._id);
        arrGroup1[i1] = user2._id;
        arrGroup1[i2] = user1._id;
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group1: arrGroup1 }
        ).exec();
      }

      if (user1.groupNumber === "2") {
        var i1 = arrGroup2.indexOf(user1._id);
        var i2 = arrGroup2.indexOf(user2._id);
        arrGroup2[i1] = user2._id;
        arrGroup2[i2] = user1._id;
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group2: arrGroup2 }
        ).exec();
      }

      if (user1.groupNumber === "3") {
        var i1 = arrGroup3.indexOf(user1._id);
        var i2 = arrGroup3.indexOf(user2._id);
        arrGroup3[i1] = user2._id;
        arrGroup3[i2] = user1._id;
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group3: arrGroup3 }
        ).exec();
      }
    } else {
      const tree = await Tree.findOne({ parent: user1.parentId }).exec();
      if (tree) {
        const arrGroup11 = tree.group1;
        const arrGroup12 = tree.group2;
        const arrGroup13 = tree.group3;

        if (user1.groupNumber === "1") {
          var i = arrGroup11.indexOf(user1._id);
          if (i > -1) {
            arrGroup11[i] = user2._id;
          }
          await Tree.findOneAndUpdate(
            { _id: tree._id },
            { group1: arrGroup11 }
          ).exec();
        }

        if (user1.groupNumber === "2") {
          var i = arrGroup12.indexOf(user1._id);
          if (i > -1) {
            arrGroup12[i] = user2._id;
          }
          await Tree.findOneAndUpdate(
            { _id: tree._id },
            { group2: arrGroup12 }
          ).exec();
        }

        if (user1.groupNumber === "3") {
          var i = arrGroup13.indexOf(user1._id);
          if (i > -1) {
            arrGroup13[i] = user2._id;
          }
          await Tree.findOneAndUpdate(
            { _id: tree._id },
            { group3: arrGroup13 }
          ).exec();
        }
      } else {
        console.log("fail to find user 1 parent");
        return;
      }

      const tree2 = await Tree.findOne({ parent: user2.parentId }).exec();
      if (tree2) {
        const arrGroup21 = tree2.group1;
        const arrGroup22 = tree2.group2;
        const arrGroup23 = tree2.group3;

        if (user2.groupNumber === "1") {
          var i = arrGroup21.indexOf(user2._id);
          if (i > -1) {
            arrGroup21[i] = user1._id;
          }
          await Tree.findOneAndUpdate(
            { _id: tree2._id },
            { group1: arrGroup21 }
          ).exec();
        }

        if (user2.groupNumber === "2") {
          var i = arrGroup22.indexOf(user2._id);
          if (i > -1) {
            arrGroup22[i] = user1._id;
          }
          await Tree.findOneAndUpdate(
            { _id: tree2._id },
            { group2: arrGroup22 }
          ).exec();
        }

        if (user2.groupNumber === "3") {
          var i = arrGroup23.indexOf(user2._id);
          if (i > -1) {
            arrGroup23[i] = user1._id;
          }
          await Tree.findOneAndUpdate(
            { _id: tree2._id },
            { group3: arrGroup23 }
          ).exec();
        }
      } else {
        console.log("fail to find user 2 parent");
        return;
      }
    }
  } else if (user1.parentId === "" && user2.parentId !== "") {
    const tree2 = await Tree.findOne({ parent: user2.parentId }).exec();
    if (tree2) {
      const arrGroup21 = tree2.group1;
      const arrGroup22 = tree2.group2;
      const arrGroup23 = tree2.group3;

      if (user2.groupNumber === "1") {
        var i = arrGroup21.indexOf(user2._id);
        if (i > -1) {
          arrGroup21[i] = user1._id;
        }
        await Tree.findOneAndUpdate(
          { _id: tree2._id },
          { group1: arrGroup21 }
        ).exec();
      }

      if (user2.groupNumber === "2") {
        var i = arrGroup22.indexOf(user2._id);
        if (i > -1) {
          arrGroup22[i] = user1._id;
        }
        await Tree.findOneAndUpdate(
          { _id: tree2._id },
          { group2: arrGroup22 }
        ).exec();
      }

      if (user2.groupNumber === "3") {
        var i = arrGroup23.indexOf(user2._id);
        if (i > -1) {
          arrGroup23[i] = user1._id;
        }
        await Tree.findOneAndUpdate(
          { _id: tree2._id },
          { group3: arrGroup23 }
        ).exec();
      }
    } else {
      console.log("fail to find user 2 parent");
      return;
    }
  } else if (user1.parentId !== "" && user2.parentId === "") {
    const tree = await Tree.findOne({ parent: user1.parentId }).exec();
    if (tree) {
      const arrGroup11 = tree.group1;
      const arrGroup12 = tree.group2;
      const arrGroup13 = tree.group3;

      if (user1.groupNumber === "1") {
        var i = arrGroup11.indexOf(user1._id);
        if (i > -1) {
          arrGroup11[i] = user2._id;
        }
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group1: arrGroup11 }
        ).exec();
      }

      if (user1.groupNumber === "2") {
        var i = arrGroup12.indexOf(user1._id);
        if (i > -1) {
          arrGroup12[i] = user2._id;
        }
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group2: arrGroup12 }
        ).exec();
      }

      if (user1.groupNumber === "3") {
        var i = arrGroup13.indexOf(user1._id);
        if (i > -1) {
          arrGroup13[i] = user2._id;
        }
        await Tree.findOneAndUpdate(
          { _id: tree._id },
          { group3: arrGroup13 }
        ).exec();
      }
    } else {
      console.log("fail to find user 1 parent");
      return;
    }
  }

  // update tree1 to parentId2
  const replacedTree = await Tree.findOneAndUpdate(
    { parent: user1._id },
    { parent: user2._id, buy_package: user2.buy_package }
  ).exec();

  // update tree1 to parentId2
  const listTreeParent2 = await Tree.find({
    $and: [{ _id: { $ne: replacedTree._id } }, { parent: user2._id }],
  }).exec();
  await Tree.findOneAndUpdate(
    { _id: listTreeParent2[0]._id },
    { parent: user1._id, buy_package: user2.buy_package }
  );

  return res.json({
    success: true,
    message: "🎉 hoán đổi thành công",
  });
};

const removeFromArr = (arr, id) => {
  const index = arr.indexOf(id);
  if (index > -1) {
    arr.splice(index, 1);
    return arr;
  }
  return;
};

const updateRootTreeGroup = async (group, rootItem, moveItem, res) => {
  const treeOfRoot = await Tree.findOne({ parent: rootItem._id }).exec();

  const treeOfRootGroup1 = treeOfRoot.group1;
  const treeOfRootGroup2 = treeOfRoot.group2;
  const treeOfRootGroup3 = treeOfRoot.group3;

  if (group === "1") {
    if (treeOfRootGroup1.find((id) => id === JSON.stringify(moveItem._id))) {
      return res.json({
        success: false,
        errors: [
          {
            label: "root_acc",
            err_message: "ID đã tồn tại trong nhóm này.Kiểm tra lại",
          },
        ],
      });
    } else {
      await Tree.findOneAndUpdate(
        { parent: rootItem._id },
        { group1: [...treeOfRootGroup1, moveItem._id] }
      ).exec();
    }
  } else if (group === "2") {
    if (treeOfRootGroup2.find((id) => id === JSON.stringify(moveItem._id))) {
      return res.json({
        success: false,
        errors: [
          {
            label: "root_acc",
            err_message: "ID đã tồn tại trong nhóm này.Kiểm tra lại",
          },
        ],
      });
    } else {
      await Tree.findOneAndUpdate(
        { parent: rootItem._id },
        { group2: [...treeOfRootGroup2, moveItem._id] }
      ).exec();
    }
  } else if (group === "3") {
    if (treeOfRootGroup3.find((id) => id === JSON.stringify(moveItem._id))) {
      return res.json({
        success: false,
        errors: [
          {
            label: "root_acc",
            err_message: "ID đã tồn tại trong nhóm này.Kiểm tra lại",
          },
        ],
      });
    } else {
      await Tree.findOneAndUpdate(
        { parent: rootItem._id },
        { group3: [...treeOfRootGroup3, moveItem._id] }
      ).exec();
    }
  } else {
    return res.json({
      success: false,
      errors: [
        {
          label: "root_acc",
          err_message: "Nhóm chuyển đến không hợp lệ.Kiểm tra lại",
        },
      ],
    });
  }
  return res.json({
    success: true,
    message: "🎉 Chuyển cây thành công!",
  });
};
