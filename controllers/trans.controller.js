const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Commission = require("../models/commission.model");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.MAIL_KEY);

exports.getPendingList = async (req, res) => {
  const list_pending = await Transaction.find({ status: "pending" }).exec();

  res.json({
    list_pending,
  });
};

exports.activeTrans = async (req, res) => {
  const id = req.params.id;

  const trans = await Transaction.findOne({ _id: id }).exec();
  const {token, email, created_by, package_buy, phone } = trans;

  const emailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "💌 ĐƯỜNG DẪN KÍCH HOẠT TÀI KHOẢN",
    html: `
    <div id=":mc" class="ii gt">
  <div id=":mb" class="a3s aiL">
    <div style="width: 100%; max-width: 650px; margin: 0px auto">
      <div class="adM"></div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tbody>
          <tr>
            <td style="background: #fff">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td valign="middle" style="padding: 8px 0px" width="180">
                      <a
                        href="#"
                        style="text-decoration: none; color: #ffffff"
                        title="Ameritec"
                        target="_blank"
                      >
                        <img
                          src="https://ameritecjsc.com/wp-content/themes/zimperium/assets/img/logo-ameritec-02.png"
                          alt="Ameritec"
                          border="0"
                          height="auto"
                          width="100%"
                          class="CToWUd"
                        />
                      </a>
                    </td>
                    <td
                      align="right"
                      style="font-size: 14px; font-family: arial"
                    >
                      Hotline: 028.2250.8166
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td
              style="
                border-collapse: collapse;
                border-left: 1px solid #ff6e40;
                border-right: 1px solid #ff6e40;
              "
            >
              <table border="0" cellpadding="0" cellspacing="0">
                <tbody>
                  <tr>
                    <td
                      style="
                        padding: 18px 20px 20px 20px;
                        vertical-align: middle;
                        line-height: 20px;
                        font-family: Arial;
                        background-color: #ff6e40;
                        text-align: center;
                      "
                    >
                      <span
                        style="
                          color: #ffffff;
                          font-size: 115%;
                          text-transform: uppercase;
                        "
                        >Kích hoạt đăng ký tài khoản</span
                      >
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 20px 12px 20px">
                      <span
                        style="
                          font-size: 13px;
                          color: #252525;
                          font-family: Arial, Helvetica, sans-serif;
                        "
                      >
                        Chào ${created_by},
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 20px 12px 20px">
                      <span
                        style="
                          font-size: 12px;
                          color: #252525;
                          font-family: Arial, Helvetica, sans-serif;
                          line-height: 18px;
                        "
                      >
                        Chúng tôi đã nhận được yêu cầu mở tài khoản của bạn tại
                        Ameritec với thông tin chính như sau:</span
                      >
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 0px 12px 0px">
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                      >
                        <tbody>
                          <tr>
                            <td
                              style="
                                padding: 8px 10px 8px 20px;
                                font-family: Arial, Helvetica, sans-serif;
                                color: #666666;
                                font-size: 12px;
                                border-bottom: 1px solid #dcdcdc;
                                border-top: 1px solid #dcdcdc;
                              "
                              width="39%"
                            >
                              <span>Gói bảo mật: </span>
                            </td>
                            <td
                              style="padding: 8px 20px 8px 10px;
                                font-family: Arial, Helvetica, sans-serif;
                                font-size: 12px;color: #252525;
                                border-bottom: 1px solid #dcdcdc;
                                border-top: 1px solid #dcdcdc;"
                            >
                            ${package_buy === 1 ? 'Cá Nhân' : 'Khởi Nghiệp'}
                            </td>
                          </tr>
                          <tr>
                            <td
                              style="
                                padding: 8px 10px 8px 20px;
                                font-family: Arial, Helvetica, sans-serif;
                                color: #666666;
                                font-size: 12px;
                                border-bottom: 1px solid #dcdcdc;
                              "
                            >
                              <span>Tên chủ tài khoản:</span>
                            </td>
                            <td
                              style="
                                padding: 8px 20px 8px 10px;
                                font-family: Arial, Helvetica, sans-serif;
                                font-size: 12px;
                                color: #252525;
                                border-bottom: 1px solid #dcdcdc;
                              "
                            >
                              <strong>${created_by}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td
                              style="
                                padding: 8px 10px 8px 20px;
                                font-family: Arial, Helvetica, sans-serif;
                                color: #666666;
                                font-size: 12px;
                                border-bottom: 1px solid #dcdcdc;
                              "
                            >
                              <span>Địa chỉ Email:</span>
                            </td>
                            <td
                              style="
                                padding: 8px 20px 8px 10px;
                                font-family: Arial, Helvetica, sans-serif;
                                font-size: 12px;
                                color: #252525;
                                border-bottom: 1px solid #dcdcdc;
                              "
                            >
                              <a
                                href="mailto:${email}"
                                target="_blank"
                                >${email}</a
                              >
                            </td>
                          </tr>
                          <tr>
                            <td
                              style="
                                padding: 8px 10px 8px 20px;
                                font-family: Arial, Helvetica, sans-serif;
                                color: #666666;
                                font-size: 12px;
                                border-bottom: 1px solid #dcdcdc;
                              "
                            >
                              <span>Số điện thoại:</span>
                            </td>
                            <td
                              style="
                                padding: 8px 20px 8px 10px;
                                font-family: Arial, Helvetica, sans-serif;
                                font-size: 12px;
                                color: #252525;
                                border-bottom: 1px solid #dcdcdc;
                              "
                            >
                              ${phone}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 20px 12px 20px">
                      <strong
                        style="
                          font-size: 12px;
                          color: #252525;
                          font-family: Arial, Helvetica, sans-serif;
                          line-height: 18px;
                        "
                      >
                        Để tiếp tục quy trình đăng ký, xin vui lòng click vào
                        đường link dưới đây :</strong
                      >
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 20px 12px 20px">
                      <div
                        style="
                          background: rgb(255, 248, 204);
                          border: 1px solid rgb(255, 140, 0);
                          padding: 10px;
                          border-radius: 3px 3px 0px 0px;
                          font-size: 11px;
                          font-family: 'Courier New', Courier, monospace;
                        "
                        align="center"
                      >
                        <a
                          title="Đường dẫn kích hoạt tài khoản"
                          href="${process.env.CLIENT_URL}/users/activate/${token}"
                          style="text-decoration: none; color: #252525"
                          target="_blank"
                          >nhấp vào đây</a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" width="100%" border="0">
                <tbody>
                  <tr>
                    <td
                      style="
                        padding: 4px 20px 12px 20px;
                        border-left: 1px solid #ff6e40;
                        border-right: 1px solid #ff6e40;
                      "
                    >
                      <span
                        style="
                          font-size: 12px;
                          color: #252525;
                          font-family: Arial, Helvetica, sans-serif;
                        "
                        >Cảm ơn bạn đã quan tâm và sử dụng dịch vụ của chúng
                        tôi</span
                      >
                    </td>
                  </tr>
                  <tr>
                    <td
                      style="
                        padding: 4px 20px 20px 20px;
                        border-left: 1px solid #ff6e40;
                        border-right: 1px solid #ff6e40;
                      "
                    >
                      <span
                        style="
                          font-size: 12px;
                          color: #252525;
                          font-family: Arial, Helvetica, sans-serif;
                        "
                        ><strong>Ban Quản Trị Ameritec</strong></span
                      >
                    </td>
                  </tr>
                  <tr>
                    <td
                      valign="middle"
                      style="
                        background-color: #6e6e6e;
                        font-size: 11px;
                        vertical-align: middle;
                        text-align: center;
                        padding: 10px 20px 10px 20px;
                        line-height: 18px;
                        border: 1px solid #6e6e6e;
                        font-family: Arial;
                        color: #cccccc;
                      "
                    >
                      Bản quyền © 2020 Ameritec <br />Phầm mềm bảo mật di động
                      hàng đầu Việt Nam
                    </td>
                  </tr>
                  <tr>
                    <td
                      style="
                        font-family: Arial;
                        padding-top: 6px;
                        font-size: 11px;
                        color: #252525;
                        text-align: center;
                      "
                    >
                      Hotline: 028.2250.8166 <br />
                      Email:
                      <a
                        style="text-decoration: none; color: #427fed"
                        href="mailto:support@nganluong.vn"
                        target="_blank"
                        >support@ameritecjsc.com</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

            `,
  };

  sgMail.send(emailData, async (error, result) => {
    if (error) {
      console.log(error.response.body);
      res.status(400).json({
        success: false,
        errors: [
          {
            label: "mail-server",
            message: "Không gửi mail được.Vui lòng thử lại sau",
          },
        ],
      });
    } else {
      console.log("active mail sended!!!! to", created_by);
      await Transaction.findOneAndUpdate(
        { _id: id },
        {
          status: "success",
          approved_time: new Date().toLocaleString("vi", {
            timeZone: "Asia/Ho_Chi_Minh",
          }),
          approved_by: 'admin',
          token: "",
          amount: process.env.PERSIONAL_PRICE,
        }
      ).exec();
      // res.json({
      //   success: true,
      //   message: `🎉 link kích hoạt đã được gửi tới ${email}`
      // });
      res.redirect(`${process.env.CLIENT_URL}/admin/active`);
    }
  });
};

exports.getReceipts = async (req,res) => {
  const { id } = req.query;
  const user = await User.findOne({_id: id }).exec();
  const transaction = await Transaction.findOne({email: user.email, status: 'success'}).exec();
  const commission = await Commission.find({receive_mem: id}).sort({_id: -1}).exec();

  res.json({transaction, commission});
}

exports.getAdminReceipts = async (req,res) => {
  const commissionSuccess = await Commission.find({status: 'success'}).sort({_id: -1}).exec();
  const commissionPending = await Commission.find({status: 'pending'}).exec();

  res.json({commissionSuccess, commissionPending});
}