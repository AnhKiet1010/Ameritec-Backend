const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Commission = require("../models/commission.model");
const { Mail } = require("./mail.js");


// ------------- transporter for mail server -------------
// let transporter = nodemailer.createTransport({
//   host: "https://mail9020.maychuemail.com",
//   port: 2096,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.AMERITEC_EMAIL, // generated ethereal user
//     pass: process.env.AMERITEC_EMAIL_PASS, // generated ethereal password
//   },
// });


exports.getPendingList = async (req, res) => {
  const list_pending = await Transaction.find({ status: "pending" }).exec();

  res.json({
    list_pending,
  });
};

exports.activeTrans = async (req, res) => {
  const id = req.params.id;

  const trans = await Transaction.findOne({ _id: id }).exec();

  const { token, email, created_by } = trans;
  const subject = "[AMERITEC] ĐƯỜNG DẪN KÍCH HOẠT TÀI KHOẢN";
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
                                                  style="padding:0 16px;background-color:#f7f6f1;line-height:20">
                                                  <div style="padding:32px 16px;background-color:#fff; line-height: 26px;">
                                                      <p>Thân gửi <b>${created_by}</b>,
                                                        <br>
                                                        <br>
                                                        Chúng tôi đã tiếp nhận yêu cầu tạo tài khoản của Bạn.Trước
                                                        tiên, Bạn cần xác nhận Email này với chúng tôi bằng cách
                                                        nhấp vào nút "Xác Nhận" bên dưới :

                                                        <a href="${process.env.CLIENT_URL}/users/activate/${token}"
                                                          target="_blank"
                                                          data-saferedirecturl="${process.env.CLIENT_URL}/users/activate/${token}"
                                                          style="text-align: center;text-decoration: none;width: 100px;display: block;padding: 10px 20px;margin: 20px auto;border-radius: 5px;background-color: #64a313;font-weight: bold;color: #fff;outline: none;
                                                        ">Xác Nhận</a>
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
    console.log("active mail sended!!!! to", email);
    await Transaction.findOneAndUpdate(
      { _id: id },
      {
        status: "success",
        approved_time: new Date().toLocaleString("vi", {
          timeZone: "Asia/Ho_Chi_Minh",
        }),
        approved_by: 'admin',
        amount: process.env.PERSIONAL_PRICE,
      }
    ).exec();
    res.redirect(`${process.env.CLIENT_URL}/admin/active`);

  } catch (err) {
    console.log("error", err);
    res.status(400).json({
      success: false,
      errors: [
        {
          label: "mail-server",
          message: "Không gửi mail được.Vui lòng thử lại sau",
        },
      ],
    });
  }
};

exports.getReceipts = async (req, res) => {
  const { id } = req.query;
  const user = await User.findOne({ _id: id }).exec();
  const transaction = await Transaction.findOne({ email: user.email, status: 'success' }).exec();
  const commission = await Commission.find({ receive_mem: id }).sort({ _id: -1 }).exec();

  res.json({ transaction, commission });
}

exports.getAdminReceipts = async (req, res) => {
  const commissionSuccess = await Commission.find({ status: 'success' }).sort({ _id: -1 }).exec();
  const commissionPending = await Commission.find({ status: 'pending' }).exec();

  res.json({ 
    status: 200,
    errors: [],
    data: { commissionSuccess, commissionPending} });
}