const User = require("../models/user.model");
const Tree = require("../models/tree.model");
const { Mail } = require("./mail.js");




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

const getResult = async (group, kq) => {
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

const getFullChildren = async (group, kq) => {
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

const getListChildId = async (id) => {
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

exports.thankMail = async (parentName, email, full_name) => {

  const subject = "[AMERITEC] THƯ CẢM ƠN BẠN ĐÃ GIỚI THIỆU TÀI KHOẢN";
  const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mail</title>
    </head>
    <body>
    <div class="">
        <div class="aHl"></div>
        <div id=":9e" tabindex="-1"></div>
        <div id=":93" class="ii gt">
          <div id=":92" class="a3s aiL msg-3508132029520417464"><u></u>
            <div>
              <center class="m_-3508132029520417464wrapper">
                <div>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" class="m_-3508132029520417464wrapper"
                    bgcolor="#F7F6F1">
                    <tbody>
                      <tr>
                        <td valign="top" bgcolor="#F7F6F1" width="100%">
                          <table width="100%" role="content-container" align="center" cellpadding="0" cellspacing="0"
                            border="0">
                            <tbody>
                              <tr>
                                <td width="100%">
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tbody>
                                      <tr>
                                        <td>
    
                                          <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                            style="width:100%;max-width:600px" align="center">
                                            <tbody>
                                              <tr>
                                                <td role="modules-container"
                                                  style="padding:32px 0px 0px 0px;color:#000000;text-align:left"
                                                  bgcolor="#F7F6F1" width="100%" align="left">
    
                                                  <table class="m_-3508132029520417464wrapper" role="module" border="0"
                                                    cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed">
                                                    <tbody>
                                                      <tr>
                                                        <td style="font-size:6px;line-height:10px;padding:0px 0px 16px 0px"
                                                          valign="top" align="center">
                                                          <img class="m_-3508132029520417464max-width CToWUd" border="0"
                                                            style="display:block;color:#000000;text-decoration:none;font-family:Helvetica,arial,sans-serif;font-size:16px;max-width:40%!important;width:20%;height:auto!important"
                                                            src="https://ameritecjsc.com/wp-content/themes/zimperium/assets/img/logo-ameritec-02.png"
                                                            alt="" width="200">
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                  <table role="module" border="0" cellpadding="0" cellspacing="0"
                                                    width="100%" style="table-layout:fixed">
                                                    <tbody>
                                                      <tr>
                                                        <td height="100%" valign="top">
                                                          <div
                                                            style="padding:0 20px;background-color:#f7f6f1;line-height:20">
                                                            <div style="padding:32px 20px;background-color:#fff; line-height: 26px;">
                                                              <p>Thân gửi <b>${parentName}</b>,
                                                                <br>
                                                                <br>
                                                                Ameritec xin chân thành cảm ơn Bạn đã giới thiệu thành công tài khoản <span style="font-weight: bold">${full_name}</span> tham gia vào gia đình Ameritec
                                                                </p>
                                                              </br>
                                                                Mọi chi tiết vui lòng liên hệ :
                                                                <br>
                                                                <ul
                                                                  style="list-style-type: square; color: #34495e">
                                                                  <li style="margin-bottom: 10px;">Văn phòng đại diện : Tầng
                                                                    25.02 Tòa nhà Viettel số 285 cách mạng tháng 8 , P.12,
                                                                    Q.10, TP. Hồ Chí Minh</li>
                                                                  <li style="margin-bottom: 10px;">Điện thoại di động:
                                                                    028.2250.8166
                                                                  </li>
                                                                  <li style="margin-bottom: 10px;">Email:
                                                                    support@ameritecjsc.com
                                                                  </li>
                                                                  <li style="margin-bottom: 10px;">Website:
                                                                    <a href="https://ameritecjsc.com"
                                                                  target="_blank"
                                                                  data-saferedirecturl="https://ameritecjsc.com">
                                                                  https://ameritecjsc.com</a>
                                                                    </li>
                                                                  </ul>
                                                                  <p style="color: gray">Bản quyền thuộc về Công Ty Cổ Phần
                                                                    Ameritec | 2020 - 2021</p>
                                                              </p>
    
                                                            </div>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                  <table role="module" align="center" border="0" cellpadding="0"
                                                    cellspacing="0" width="100%" style="table-layout:fixed">
                                                    <tbody>
                                                      <tr>
                                                        <td valign="top"
                                                          style="padding:16px 0px 0px 0px;font-size:6px;line-height:10px">
                                                          <table align="center">
                                                            <tbody>
                                                              <tr>
                                                                <td style="padding:0px 5px">
                                                                  <a role="social-icon-link" href="https://www.facebook.com/ameritecjsc"
                                                                    alt="Facebook" title="Facebook "
                                                                    style="border-radius:2px;display:inline-block;background-color:#3b579d"
                                                                    target="_blank"
                                                                    data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/ameritecjsc&amp;source=gmail&amp;ust=1619031131977000&amp;usg=AFQjCNHQmRbZpFhWdj7esEk7ow0b_zG9cA">
                                                                    <img role="social-icon" alt="Facebook" title="Facebook "
                                                                      height="30" width="30"
                                                                      src="https://ci4.googleusercontent.com/proxy/K1eMvXT1j0-5WuAYzEYqtvFJMgW9CbX-EiTADXY3a_KswGhH6_Pi_oaE2m0rPYdsHLuGsLZX5DXOWczTu9DXcOdkWBqkH3rl5eMY8XNsZuV0Wt1feIaGxafEwWAiSmfW=s0-d-e1-ft#https://marketing-image-production.s3.amazonaws.com/social/white/facebook.png"
                                                                      class="CToWUd">
                                                                  </a>
                                                                </td>
    
                                                                <td style="padding:0px 5px">
                                                                  <a role="social-icon-link"
                                                                    href="https://www.youtube.com/channel/UCh0r0lk4Nk0KxLLaU1LUVnA"
                                                                    alt="Instagram" title="Instagram "
                                                                    style="border-radius:2px;display:inline-block;background-color:#7f4b30"
                                                                    target="_blank"
                                                                    data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCh0r0lk4Nk0KxLLaU1LUVnA&amp;source=gmail&amp;ust=1619031131977000&amp;usg=AFQjCNHZYmGVDuZEQkzGB248K8aetQtsSw">
                                                                    <img role="social-icon" alt="Youtube"
                                                                      title="Youtube " height="30" width="30"
                                                                      src="https://icons-for-free.com/iconfiles/png/512/tube+video+you+youtube+icon-1320185153402885670.png"
                                                                      class="CToWUd">
                                                                  </a>
                                                                </td>
    
    
    
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                  <div role="module"
                                                    style="color:#444444;font-size:12px;line-height:20px;padding:16px 16px 16px 16px;text-align:center">
                                                  </div>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
    
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </center>
              <img
                src="https://ci3.googleusercontent.com/proxy/1fjQwUmop-HyJVaulTA57GGFlFmu0-ggkWuVEfdgTkDmzAccDPNUJGekBkLJyNgmx53Pi-KmljrAJSjH7alShtAh95odwjHrjwiRC9shZ3Ptg-zU5n1N8QjaFPctPNIlHUZlkjr61HzcCmQKsWoSIBCSRauQ5poF_Pr1YNpbpzp0ESA8jSYr_53oh8y19CiDju0s3pTZSLx-imbcIhI750xO1Ktun133BGWOLPBkLi7k0A8WGth3ryGwEM_cHwWlDg5Vth-FtDG23zZHHLq_oOaiuCFPtpqy58CvBds5AX7QmNvHT17rEz_ZUrukPWyvUpEdqg9NblW3bAtS0ouaYevHj2QMsO5vxDpH1ASttEyTK0kbcTTL2Yum2AHmKFIc3rkgalW7BJ6T6De1jB7siUqdCT5MgeHUBt3w2ON11QOWgM_R7uPOUHr2CnOwhqBgLaZeVS50vEpXXkKqetlSEM8opXoirsVpIuABSNUSNeiYwKoylAoJCv03yKUuaIfyNdAhSjPaw3H8lQCJftCIhoUw82oXMBuFHJPdmlc84RGBZUliLgHT2seL6-gPNsW5mHJZ06NvI1VD052BARbgAWlLbtH6hkB8-6otVmsl3sWwFflxJC8orNiSuoA=s0-d-e1-ft#http://url5616.coders-x.com/wf/open?upn=bXICfEuWu47bhJwXYqwTRvqJTENX8zPTpCdkz3FNpu-2BFcvkzYw-2B39SJ4cEfvnSODAnR03Z9qpDVuTsHBrji689weS-2Fy6JnEqAwNCbVyZM6uklTX94734B-2FtrfYInRcQ4hCV8vgJ97a8cphoMTNezitfUXj9NXuSafpIRkDo05XH8fGVZeKp2RkQGuGT3iyEOob9VjD8l-2F2rXk-2FV-2F-2Fe9bTbt7tLWvCgB5Lo7PJpbHPX7vN9bIlzRHkxi4-2BP4-2BSsX4H-2F0hjbrI8vYh-2FJhXY6S5vn8yQw844ezthR0k4AHWL-2FIxXQX4W8gmOxPyoWXqJ0vOIGYy-2F4yrrfwjGI5Fwi-2FDskjgQfVnTVqYuGU3wySQe0uaPrFSE36ddpuMjBear-2Fxp"
                alt="" width="1" height="1" border="0"
                style="height:1px!important;width:1px!important;border-width:0!important;margin-top:0!important;margin-bottom:0!important;margin-right:0!important;margin-left:0!important;padding-top:0!important;padding-bottom:0!important;padding-right:0!important;padding-left:0!important"
                class="CToWUd">
            </div>
            <div class="yj6qo"></div>
            <div class="adL">
            </div>
          </div>
        </div>
        <div id=":9i" class="ii gt" style="display:none">
          <div id=":9j" class="a3s aiL "></div>
        </div>
        <div class="hi"></div>
      </div>
        </body>
    </html>
          `;

  try {

    await Mail(email, html, subject);
    console.log("thanks mail sended!!!! to", email);
    return true;

  } catch (err) {
    console.log("error send thanks mail!!!! to", email);
    return false;
  }
};

exports.successMail = async (full_name, email, phone, links) => {
  const subject = "[AMERITEC] ĐÃ KÍCH HOẠT TÀI KHOẢN THÀNH CÔNG";
  const html = `
      <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mail</title>
  </head>
  <body>
  <div class="">
      <div class="aHl"></div>
      <div id=":9e" tabindex="-1"></div>
      <div id=":93" class="ii gt">
        <div id=":92" class="a3s aiL msg-3508132029520417464"><u></u>
          <div>
            <center class="m_-3508132029520417464wrapper">
              <div>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" class="m_-3508132029520417464wrapper"
                  bgcolor="#F7F6F1">
                  <tbody>
                    <tr>
                      <td valign="top" bgcolor="#F7F6F1" width="100%">
                        <table width="100%" role="content-container" align="center" cellpadding="0" cellspacing="0"
                          border="0">
                          <tbody>
                            <tr>
                              <td width="100%">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tbody>
                                    <tr>
                                      <td>
  
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                          style="width:100%;max-width:600px" align="center">
                                          <tbody>
                                            <tr>
                                              <td role="modules-container"
                                                style="padding:32px 0px 0px 0px;color:#000000;text-align:left"
                                                bgcolor="#F7F6F1" width="100%" align="left">
  
                                                <table class="m_-3508132029520417464wrapper" role="module" border="0"
                                                  cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed">
                                                  <tbody>
                                                    <tr>
                                                      <td style="font-size:6px;line-height:10px;padding:0px 0px 16px 0px"
                                                        valign="top" align="center">
                                                        <img class="m_-3508132029520417464max-width CToWUd" border="0"
                                                          style="display:block;color:#000000;text-decoration:none;font-family:Helvetica,arial,sans-serif;font-size:16px;max-width:40%!important;width:20%;height:auto!important"
                                                          src="https://ameritecjsc.com/wp-content/themes/zimperium/assets/img/logo-ameritec-02.png"
                                                          alt="" width="200">
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table role="module" border="0" cellpadding="0" cellspacing="0"
                                                  width="100%" style="table-layout:fixed">
                                                  <tbody>
                                                    <tr>
                                                      <td height="100%" valign="top">
                                                        <div
                                                          style="padding:0 20px;background-color:#f7f6f1;line-height:20">
                                                          <div style="padding:32px 20px;background-color:#fff; line-height: 26px;">
                                                            <p>Thân gửi <b>${full_name}</b>,
                                                              <br>
                                                              <br>
                                                              Chúc mừng Bạn đã đăng ký thành công tài khoản tại <span style="font-weight: bold">Ameritec</span>
                                                              </p>
                                                              <p>Thông tin tài khoản</p>
                                                              <div>
  
                                                                <ul>
                                                                <li style="margin-bottom: 10px;">Họ và tên : ${full_name}</li>
                                                                <li style="margin-bottom: 10px;">Điện thoại di động: ${phone}
                                                              </li>
                                                              <li style="margin-bottom: 10px;">Email: ${email}
                                                              </li>
                                                              <li style="margin-bottom: 10px;">Link giới thiệu: Vui lòng truy cập vào <a href="${process.env.CLIENT_URL}/login">hệ thống</a> để tạo link giới thiệu.</li>
                                                              </ul>
                                                              </div>
                                                                <div>
                                                                  <p style="color: #2c3e50">Đường dẫn kích hoạt AIPS App</p>
                                                                </div>
                                                                <div>
                                                              
                                                                <ul style="color: #34495e">
                                                                ${links.map((link, index) => {
    return `<li style="margin-bottom: 10px;">Link ${index + 1} : <a href=https://ameritec.zimperium.com/api/acceptor/v1/user-activation/activation?stoken=${link}>AIPS APP ${index + 1}</a></li>`;
  })}
                                                              </ul>
                                                            </br>
                                                              Mọi chi tiết vui lòng liên hệ :
                                                              <br>
                                                              <ul
                                                                style="list-style-type: square; color: #34495e">
                                                                <li style="margin-bottom: 10px;">Văn phòng đại diện : Tầng
                                                                  25.02 Tòa nhà Viettel số 285 cách mạng tháng 8 , P.12,
                                                                  Q.10, TP. Hồ Chí Minh</li>
                                                                <li style="margin-bottom: 10px;">Điện thoại di động:
                                                                  028.2250.8166
                                                                </li>
                                                                <li style="margin-bottom: 10px;">Email:
                                                                  support@ameritecjsc.com
                                                                </li>
                                                                <li style="margin-bottom: 10px;">Website:
                                                                  <a href="https://ameritecjsc.com"
                                                                target="_blank"
                                                                data-saferedirecturl="https://ameritecjsc.com">
                                                                https://ameritecjsc.com</a>
                                                                  </li>
                                                                </ul>
                                                                <p style="color: gray">Bản quyền thuộc về Công Ty Cổ Phần
                                                                  Ameritec | 2020 - 2021</p>
                                                            </p>
  
                                                          </div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table role="module" align="center" border="0" cellpadding="0"
                                                  cellspacing="0" width="100%" style="table-layout:fixed">
                                                  <tbody>
                                                    <tr>
                                                      <td valign="top"
                                                        style="padding:16px 0px 0px 0px;font-size:6px;line-height:10px">
                                                        <table align="center">
                                                          <tbody>
                                                            <tr>
                                                              <td style="padding:0px 5px">
                                                                <a role="social-icon-link" href="https://www.facebook.com/ameritecjsc"
                                                                  alt="Facebook" title="Facebook "
                                                                  style="border-radius:2px;display:inline-block;background-color:#3b579d"
                                                                  target="_blank"
                                                                  data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/ameritecjsc&amp;source=gmail&amp;ust=1619031131977000&amp;usg=AFQjCNHQmRbZpFhWdj7esEk7ow0b_zG9cA">
                                                                  <img role="social-icon" alt="Facebook" title="Facebook "
                                                                    height="30" width="30"
                                                                    src="https://ci4.googleusercontent.com/proxy/K1eMvXT1j0-5WuAYzEYqtvFJMgW9CbX-EiTADXY3a_KswGhH6_Pi_oaE2m0rPYdsHLuGsLZX5DXOWczTu9DXcOdkWBqkH3rl5eMY8XNsZuV0Wt1feIaGxafEwWAiSmfW=s0-d-e1-ft#https://marketing-image-production.s3.amazonaws.com/social/white/facebook.png"
                                                                    class="CToWUd">
                                                                </a>
                                                              </td>
  
                                                              <td style="padding:0px 5px">
                                                                <a role="social-icon-link"
                                                                  href="https://www.youtube.com/channel/UCh0r0lk4Nk0KxLLaU1LUVnA"
                                                                  alt="Instagram" title="Instagram "
                                                                  style="border-radius:2px;display:inline-block;background-color:#7f4b30"
                                                                  target="_blank"
                                                                  data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCh0r0lk4Nk0KxLLaU1LUVnA&amp;source=gmail&amp;ust=1619031131977000&amp;usg=AFQjCNHZYmGVDuZEQkzGB248K8aetQtsSw">
                                                                  <img role="social-icon" alt="Youtube"
                                                                    title="Youtube " height="30" width="30"
                                                                    src="https://icons-for-free.com/iconfiles/png/512/tube+video+you+youtube+icon-1320185153402885670.png"
                                                                    class="CToWUd">
                                                                </a>
                                                              </td>
  
  
  
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <div role="module"
                                                  style="color:#444444;font-size:12px;line-height:20px;padding:16px 16px 16px 16px;text-align:center">
                                                </div>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
  
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </center>
            <img
              src="https://ci3.googleusercontent.com/proxy/1fjQwUmop-HyJVaulTA57GGFlFmu0-ggkWuVEfdgTkDmzAccDPNUJGekBkLJyNgmx53Pi-KmljrAJSjH7alShtAh95odwjHrjwiRC9shZ3Ptg-zU5n1N8QjaFPctPNIlHUZlkjr61HzcCmQKsWoSIBCSRauQ5poF_Pr1YNpbpzp0ESA8jSYr_53oh8y19CiDju0s3pTZSLx-imbcIhI750xO1Ktun133BGWOLPBkLi7k0A8WGth3ryGwEM_cHwWlDg5Vth-FtDG23zZHHLq_oOaiuCFPtpqy58CvBds5AX7QmNvHT17rEz_ZUrukPWyvUpEdqg9NblW3bAtS0ouaYevHj2QMsO5vxDpH1ASttEyTK0kbcTTL2Yum2AHmKFIc3rkgalW7BJ6T6De1jB7siUqdCT5MgeHUBt3w2ON11QOWgM_R7uPOUHr2CnOwhqBgLaZeVS50vEpXXkKqetlSEM8opXoirsVpIuABSNUSNeiYwKoylAoJCv03yKUuaIfyNdAhSjPaw3H8lQCJftCIhoUw82oXMBuFHJPdmlc84RGBZUliLgHT2seL6-gPNsW5mHJZ06NvI1VD052BARbgAWlLbtH6hkB8-6otVmsl3sWwFflxJC8orNiSuoA=s0-d-e1-ft#http://url5616.coders-x.com/wf/open?upn=bXICfEuWu47bhJwXYqwTRvqJTENX8zPTpCdkz3FNpu-2BFcvkzYw-2B39SJ4cEfvnSODAnR03Z9qpDVuTsHBrji689weS-2Fy6JnEqAwNCbVyZM6uklTX94734B-2FtrfYInRcQ4hCV8vgJ97a8cphoMTNezitfUXj9NXuSafpIRkDo05XH8fGVZeKp2RkQGuGT3iyEOob9VjD8l-2F2rXk-2FV-2F-2Fe9bTbt7tLWvCgB5Lo7PJpbHPX7vN9bIlzRHkxi4-2BP4-2BSsX4H-2F0hjbrI8vYh-2FJhXY6S5vn8yQw844ezthR0k4AHWL-2FIxXQX4W8gmOxPyoWXqJ0vOIGYy-2F4yrrfwjGI5Fwi-2FDskjgQfVnTVqYuGU3wySQe0uaPrFSE36ddpuMjBear-2Fxp"
              alt="" width="1" height="1" border="0"
              style="height:1px!important;width:1px!important;border-width:0!important;margin-top:0!important;margin-bottom:0!important;margin-right:0!important;margin-left:0!important;padding-top:0!important;padding-bottom:0!important;padding-right:0!important;padding-left:0!important"
              class="CToWUd">
          </div>
          <div class="yj6qo"></div>
          <div class="adL">
          </div>
        </div>
      </div>
      <div id=":9i" class="ii gt" style="display:none">
        <div id=":9j" class="a3s aiL "></div>
      </div>
      <div class="hi"></div>
    </div>
      </body>
  </html>
      `;

  try {

    await Mail(email, html, subject);
    console.log("success mail sended!!!! to", email);
    return true;

  } catch (err) {
    console.log("error send success mail!!!! to", email);
    return false;
  }
}

exports.upgradeMail = async (full_name, email, phone, links) => {
  const subject = "[AMERITEC] NÂNG CẤP TÀI KHOẢN THÀNH CÔNG";
  const html = `
      <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mail</title>
  </head>
  <body>
  <div class="">
      <div class="aHl"></div>
      <div id=":9e" tabindex="-1"></div>
      <div id=":93" class="ii gt">
        <div id=":92" class="a3s aiL msg-3508132029520417464"><u></u>
          <div>
            <center class="m_-3508132029520417464wrapper">
              <div>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" class="m_-3508132029520417464wrapper"
                  bgcolor="#F7F6F1">
                  <tbody>
                    <tr>
                      <td valign="top" bgcolor="#F7F6F1" width="100%">
                        <table width="100%" role="content-container" align="center" cellpadding="0" cellspacing="0"
                          border="0">
                          <tbody>
                            <tr>
                              <td width="100%">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tbody>
                                    <tr>
                                      <td>
  
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                          style="width:100%;max-width:600px" align="center">
                                          <tbody>
                                            <tr>
                                              <td role="modules-container"
                                                style="padding:32px 0px 0px 0px;color:#000000;text-align:left"
                                                bgcolor="#F7F6F1" width="100%" align="left">
  
                                                <table class="m_-3508132029520417464wrapper" role="module" border="0"
                                                  cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed">
                                                  <tbody>
                                                    <tr>
                                                      <td style="font-size:6px;line-height:10px;padding:0px 0px 16px 0px"
                                                        valign="top" align="center">
                                                        <img class="m_-3508132029520417464max-width CToWUd" border="0"
                                                          style="display:block;color:#000000;text-decoration:none;font-family:Helvetica,arial,sans-serif;font-size:16px;max-width:40%!important;width:20%;height:auto!important"
                                                          src="https://ameritecjsc.com/wp-content/themes/zimperium/assets/img/logo-ameritec-02.png"
                                                          alt="" width="200">
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table role="module" border="0" cellpadding="0" cellspacing="0"
                                                  width="100%" style="table-layout:fixed">
                                                  <tbody>
                                                    <tr>
                                                      <td height="100%" valign="top">
                                                        <div
                                                          style="padding:0 20px;background-color:#f7f6f1;line-height:20">
                                                          <div style="padding:32px 20px;background-color:#fff; line-height: 26px;">
                                                            <p>Thân gửi <b>${full_name}</b>,
                                                              <br>
                                                              <br>
                                                              Chúc mừng Bạn đã nâng cấp thành công tài khoản tại <span style="font-weight: bold">Ameritec</span>
                                                              </p>
                                                              <p>Thông tin tài khoản</p>
                                                              <div>
  
                                                                <ul>
                                                                <li style="margin-bottom: 10px;">Họ và tên : ${full_name}</li>
                                                                <li style="margin-bottom: 10px;">Điện thoại di động: ${phone}
                                                              </li>
                                                              <li style="margin-bottom: 10px;">Email: ${email}
                                                              </li>
                                                              <li style="margin-bottom: 10px;">Link giới thiệu: Vui lòng truy cập vào <a href="${process.env.CLIENT_URL}/login">hệ thống</a> để tạo link giới thiệu.</li>
                                                              </ul>
                                                              </div>
                                                                <div>
                                                                  <p style="color: #2c3e50">Đường dẫn kích hoạt AIPS App</p>
                                                                </div>
                                                                <div>
                                                              
                                                                <ul style="color: #34495e">
                                                                ${links.map((link, index) => {
    return `<li style="margin-bottom: 10px;">Link ${index + 1} : <a href=https://ameritec.zimperium.com/api/acceptor/v1/user-activation/activation?stoken=${link}>AIPS APP ${index + 1}</a></li>`;
  })}
                                                              </ul>
                                                            </br>
                                                              Mọi chi tiết vui lòng liên hệ :
                                                              <br>
                                                              <ul
                                                                style="list-style-type: square; color: #34495e">
                                                                <li style="margin-bottom: 10px;">Văn phòng đại diện : Tầng
                                                                  25.02 Tòa nhà Viettel số 285 cách mạng tháng 8 , P.12,
                                                                  Q.10, TP. Hồ Chí Minh</li>
                                                                <li style="margin-bottom: 10px;">Điện thoại di động:
                                                                  028.2250.8166
                                                                </li>
                                                                <li style="margin-bottom: 10px;">Email:
                                                                  support@ameritecjsc.com
                                                                </li>
                                                                <li style="margin-bottom: 10px;">Website:
                                                                  <a href="https://ameritecjsc.com"
                                                                target="_blank"
                                                                data-saferedirecturl="https://ameritecjsc.com">
                                                                https://ameritecjsc.com</a>
                                                                  </li>
                                                                </ul>
                                                                <p style="color: gray">Bản quyền thuộc về Công Ty Cổ Phần
                                                                  Ameritec | 2020 - 2021</p>
                                                            </p>
  
                                                          </div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <table role="module" align="center" border="0" cellpadding="0"
                                                  cellspacing="0" width="100%" style="table-layout:fixed">
                                                  <tbody>
                                                    <tr>
                                                      <td valign="top"
                                                        style="padding:16px 0px 0px 0px;font-size:6px;line-height:10px">
                                                        <table align="center">
                                                          <tbody>
                                                            <tr>
                                                              <td style="padding:0px 5px">
                                                                <a role="social-icon-link" href="https://www.facebook.com/ameritecjsc"
                                                                  alt="Facebook" title="Facebook "
                                                                  style="border-radius:2px;display:inline-block;background-color:#3b579d"
                                                                  target="_blank"
                                                                  data-saferedirecturl="https://www.google.com/url?q=https://www.facebook.com/ameritecjsc&amp;source=gmail&amp;ust=1619031131977000&amp;usg=AFQjCNHQmRbZpFhWdj7esEk7ow0b_zG9cA">
                                                                  <img role="social-icon" alt="Facebook" title="Facebook "
                                                                    height="30" width="30"
                                                                    src="https://ci4.googleusercontent.com/proxy/K1eMvXT1j0-5WuAYzEYqtvFJMgW9CbX-EiTADXY3a_KswGhH6_Pi_oaE2m0rPYdsHLuGsLZX5DXOWczTu9DXcOdkWBqkH3rl5eMY8XNsZuV0Wt1feIaGxafEwWAiSmfW=s0-d-e1-ft#https://marketing-image-production.s3.amazonaws.com/social/white/facebook.png"
                                                                    class="CToWUd">
                                                                </a>
                                                              </td>
  
                                                              <td style="padding:0px 5px">
                                                                <a role="social-icon-link"
                                                                  href="https://www.youtube.com/channel/UCh0r0lk4Nk0KxLLaU1LUVnA"
                                                                  alt="Instagram" title="Instagram "
                                                                  style="border-radius:2px;display:inline-block;background-color:#7f4b30"
                                                                  target="_blank"
                                                                  data-saferedirecturl="https://www.google.com/url?q=https://www.youtube.com/channel/UCh0r0lk4Nk0KxLLaU1LUVnA&amp;source=gmail&amp;ust=1619031131977000&amp;usg=AFQjCNHZYmGVDuZEQkzGB248K8aetQtsSw">
                                                                  <img role="social-icon" alt="Youtube"
                                                                    title="Youtube " height="30" width="30"
                                                                    src="https://icons-for-free.com/iconfiles/png/512/tube+video+you+youtube+icon-1320185153402885670.png"
                                                                    class="CToWUd">
                                                                </a>
                                                              </td>
  
  
  
                                                            </tr>
                                                          </tbody>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <div role="module"
                                                  style="color:#444444;font-size:12px;line-height:20px;padding:16px 16px 16px 16px;text-align:center">
                                                </div>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
  
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </center>
            <img
              src="https://ci3.googleusercontent.com/proxy/1fjQwUmop-HyJVaulTA57GGFlFmu0-ggkWuVEfdgTkDmzAccDPNUJGekBkLJyNgmx53Pi-KmljrAJSjH7alShtAh95odwjHrjwiRC9shZ3Ptg-zU5n1N8QjaFPctPNIlHUZlkjr61HzcCmQKsWoSIBCSRauQ5poF_Pr1YNpbpzp0ESA8jSYr_53oh8y19CiDju0s3pTZSLx-imbcIhI750xO1Ktun133BGWOLPBkLi7k0A8WGth3ryGwEM_cHwWlDg5Vth-FtDG23zZHHLq_oOaiuCFPtpqy58CvBds5AX7QmNvHT17rEz_ZUrukPWyvUpEdqg9NblW3bAtS0ouaYevHj2QMsO5vxDpH1ASttEyTK0kbcTTL2Yum2AHmKFIc3rkgalW7BJ6T6De1jB7siUqdCT5MgeHUBt3w2ON11QOWgM_R7uPOUHr2CnOwhqBgLaZeVS50vEpXXkKqetlSEM8opXoirsVpIuABSNUSNeiYwKoylAoJCv03yKUuaIfyNdAhSjPaw3H8lQCJftCIhoUw82oXMBuFHJPdmlc84RGBZUliLgHT2seL6-gPNsW5mHJZ06NvI1VD052BARbgAWlLbtH6hkB8-6otVmsl3sWwFflxJC8orNiSuoA=s0-d-e1-ft#http://url5616.coders-x.com/wf/open?upn=bXICfEuWu47bhJwXYqwTRvqJTENX8zPTpCdkz3FNpu-2BFcvkzYw-2B39SJ4cEfvnSODAnR03Z9qpDVuTsHBrji689weS-2Fy6JnEqAwNCbVyZM6uklTX94734B-2FtrfYInRcQ4hCV8vgJ97a8cphoMTNezitfUXj9NXuSafpIRkDo05XH8fGVZeKp2RkQGuGT3iyEOob9VjD8l-2F2rXk-2FV-2F-2Fe9bTbt7tLWvCgB5Lo7PJpbHPX7vN9bIlzRHkxi4-2BP4-2BSsX4H-2F0hjbrI8vYh-2FJhXY6S5vn8yQw844ezthR0k4AHWL-2FIxXQX4W8gmOxPyoWXqJ0vOIGYy-2F4yrrfwjGI5Fwi-2FDskjgQfVnTVqYuGU3wySQe0uaPrFSE36ddpuMjBear-2Fxp"
              alt="" width="1" height="1" border="0"
              style="height:1px!important;width:1px!important;border-width:0!important;margin-top:0!important;margin-bottom:0!important;margin-right:0!important;margin-left:0!important;padding-top:0!important;padding-bottom:0!important;padding-right:0!important;padding-left:0!important"
              class="CToWUd">
          </div>
          <div class="yj6qo"></div>
          <div class="adL">
          </div>
        </div>
      </div>
      <div id=":9i" class="ii gt" style="display:none">
        <div id=":9j" class="a3s aiL "></div>
      </div>
      <div class="hi"></div>
    </div>
      </body>
  </html>
      `;

  try {

    await Mail(email, html, subject);
    console.log("success mail sended!!!! to", email);
    return true;

  } catch (err) {
    console.log("error send success mail!!!! to", email);
    return false;
  }
}

exports.randomString = (length = 6) => {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }
  return result.join('');
}

const getTreeChild = async (idcha) => {
  var userCha = await User.findOne({ _id: idcha })
    .exec();
  var listCon = await getListChildId2(idcha);
  var child = [];
  for (const element of listCon) {
    await child.push(await getTreeChild(element));
  }
  var Cha = {
    title: userCha.full_name,
    children: child
  };
  return Cha;
}
