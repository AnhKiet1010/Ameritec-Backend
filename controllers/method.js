const User = require("../models/user.model");
const Tree = require("../models/tree.model");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.MAIL_KEY);

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

exports.countTotalChildMemberForLevel = async (
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

exports.countTotalPersonPackage = async (subTreeIdList, countLevel, level) => {
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

exports.getData = async (group, parentIn) => {
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

exports.cutName = (name) => {
  const nameArr = name.split(" ");
  const newName = nameArr.slice(nameArr.length - 2, nameArr.length).join(" ");
  return newName;
};

exports.getResult = async (group, kq) => {
  for (let id of group) {
    let parent = await User.findOne({ _id: id });
    let listGroup = await getListChildId(id);
    if (listGroup.length > 0) {
      for (let i of listGroup) {
        let child = await User.findOne({ _id: i });
        kq.push({
          child: cutName(child.full_name),
          parent: cutName(parent.full_name),
        });
      }
      await getResult(listGroup, kq);
    } else {
      continue;
    }
  }
  return kq;
};

exports.getFullChildren = async (group, kq) => {
  for (let id of group) {
    let parent = await User.findOne({ _id: id }).select("full_name").exec();
    kq.push(parent);
    let listGroup = await getListChildId(id);
    if (listGroup.length > 0) {
      await getFullChildren(listGroup, kq);
    } else {
      continue;
    }
  }
  return kq;
};

exports.getListChildId = async (id) => {
  const objBranch = await Tree.findOne({ parent: id })
    .select("group1 group2 group3")
    .exec();

  const { group1, group2, group3 } = objBranch;

  return [...group1, ...group2, ...group3];
};

exports.countTotalChildMember = async (subTreeIdList) => {
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

exports.getSubUserListAndChildNumber = async (current_user_id) => {
  let branchObject = await Tree.findOne({ parent: current_user_id })
    .select("group1 group2 group3")
    .exec();
  let group = [
    ...branchObject.group1,
    ...branchObject.group2,
    ...branchObject.group3,
  ];

  var subTreeIdList = [];
  var subUserListAndChild = [];

  for (let id of group) {
    const user = await User.findOne({ _id: id }).exec();
    var childNumber = 0;
    const childGroupObj = await Tree.findOne({ parent: id }).exec();
    if (childGroupObj) {
      const childGroupArr = [
        ...childGroupObj.group1,
        ...childGroupObj.group2,
        ...childGroupObj.group3,
      ];
      childNumber = await countTotalChildMember(childGroupArr);
    }
    if (!user) {
      console.log("loop user err");
    } else {
      subTreeIdList.push(user._id);
      subUserListAndChild.push({ user, childNumber });
    }
  }
  return { subTreeIdList, subUserListAndChild };
};

const updateParent = async (id, buy_package) => {
  const parent = await User.findOne({ _id: id }).exec();
  console.log("findParentToUpdate", parent);
  const checkUp = await checkUpLevel(parent, buy_package);

  await User.findOneAndUpdate(
    { _id: parent._id },
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

exports.thankMail = (parentName, parentEmail, full_name) => {
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

const getListChildId = async (id) => {
    const objBranch = await Tree.findOne({ parent: id }).select('group1 group2 group3').exec();
  
    const {group1, group2, group3} = objBranch;
  
    return [...group1, ...group2, ...group3];
}

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
