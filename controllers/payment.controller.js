const sgMail = require("@sendgrid/mail");
const {
  checkoutNganLuong,
  callbackNganLuong,
} = require("./nganluong-handlers");
const Transaction = require("../models/transaction.model");
sgMail.setApiKey(process.env.MAIL_KEY);

exports.checkout = async (req, res) => {
  console.log("body", req.body);
  const { email, payment_method, bank_code } = req.body;
  if (payment_method === "nganluong" || payment_method === "nganluongvisa") {
    const userAgent = req.headers["user-agent"];
    console.log("userAgent", userAgent);

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
          res.redirect(checkoutUrl.href);
          res.end();
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
    asyncFunc.then(() => {
      // res.json({
      //   status: 200,
      //   message: "Thanh toán thành công",
      //   data: {
      //     title: `Ameritec ${gateway.toUpperCase()}`,
      //     isSucceed: res.locals.isSucceed,
      //   },
      //   errors: [],
      // });
      const title = `${gateway.toUpperCase()}`;
      const isSucceed = res.locals.isSucceed;
      const email = res.locals.email;
      const orderId = res.locals.orderId;
      const price = res.locals.price;
      const message = res.locals.message;
      if (isSucceed) {
        const trans = Transaction.findOne({ email }).exec();
        const { token, email, created_by, package_buy, phone } = trans;

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
                            ${package_buy === 1 ? "Cá Nhân" : "Khởi Nghiệp"}
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
                          href="${
                            process.env.CLIENT_URL
                          }/users/activate/${token}"
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
              { $and: [{email}, {status: "pending"}] },
              {
                status: "success",
                approved_time: new Date().toLocaleString("vi", {
                  timeZone: "Asia/Ho_Chi_Minh",
                  approved_by: "auto",
                }),
                orderId,
                amount: price
              }
            ).exec();
          }
        });
        res.redirect(
          `${process.env.CLIENT_URL}/pay-success/${isSucceed}/${title}/${email}/${orderId}/${price}/${message}`
        );
      } else {
        `${process.env.CLIENT_URL}/pay-success/${isSucceed}/${title}/${email}/${orderId}/${price}/${message}`
      }
    });
  } else {
    res.send("No callback found");
  }
};

exports.cancel = async (req, res) => {
  res.redirect(process.env.CLIENT_URL);
};
