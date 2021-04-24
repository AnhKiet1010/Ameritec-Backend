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
        const trans = await Transaction.findOne({ email: res.locals.email }).exec();
        const { token, email, created_by } = trans;

        const emailData = {
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "[AMERITEC] ĐƯỜNG DẪN KÍCH HOẠT TÀI KHOẢN",
          html: `
          <div style="margin: 50px ">

          <div style="max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; align-items: center">
            <div>
              <img src="https://ameritecjsc.com/wp-content/themes/zimperium/assets/img/logo-ameritec-02.png" width="140px" alt="logo">
            </div>
            <div>
            <p style="font-size: 20px">AIPS App ứng dụng bảo mật di động hàng đầu</p>
            </div>
            <div>
              <p style="font-size: 18px">Chào mừng bạn đến với <span style="font-weight: bold">Ameritec</span></p>
            </div>
            <div>
            <p style="font-size: 17px;">Xin chào : <span style="color: #000; font-weight: bold">${created_by}</span></p>
            </div>
            <div>
              <p style="font-size: 17px; color: #2c3e50">Chúng tôi đã tiếp nhận yêu cầu tạo tài khoản của Bạn.Trước tiên, Bạn cần xác nhận Email này với chúng tôi bằng cách nhấp vào nút "Xác Nhận" bên dưới : </p>
            </div>
            <div>
              <a href="${process.env.CLIENT_URL}/users/activate/${token}" style="font-size: 20px"><button style="
                 padding: 10px 20px;
                 border-radius: 5px;
                 background-color: #64a313;
                 font-weight: bold;
                 color: #fff;
                 outline: none;
              ">Xác Nhận</button></a>
            </div>
          </div>
          
          <div>
          <div>
          <p style="font-size: 16px; color: #34495e">Mọi chi tiết vui lòng liên hệ : </p>
          
          <ul style="font-size: 16px; list-style-type: square; color: #34495e">
            <li style="margin-bottom: 10px;">Văn phòng đại diện : Tầng 25.02 Tòa nhà Viettel số 285 cách mạng tháng 8 , P.12, Q.10, TP. Hồ Chí Minh</li>
            <li style="margin-bottom: 10px;">Điện thoại di động: 028.2250.8166
          </li>
          <li style="margin-bottom: 10px;">Email: support@ameritecjsc.com
          </li>
          <li style="margin-bottom: 10px;">Website: https://ameritecjsc.com</li>
          </ul>
          <p style="color: gray">Bản quyền thuộc về Công Ty Cổ Phần Ameritec | 2020 - 2021</p>
          
          </div>
          </div>
          </div>
            `,
        };

        await sgMail.send(emailData, async (error, result) => {
          if (error) {
            console.log(error.response.body);
            return res.status(400).json({
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
                  timeZone: "Asia/Ho_Chi_Minh"
                }),
                approved_by: "auto",
                orderId,
                amount: price,
                token: ""
              }
            ).exec();
          }
        });
        return res.redirect(
          `${process.env.CLIENT_URL}/pay-success/${isSucceed}/${title}/${email}/${orderId}/${price}/${message}`
        );
      } else {
        return res.redirect(`${process.env.CLIENT_URL}/pay-success/${isSucceed}/${title}/${email}/${orderId}/${price}/${message}`);
      }
    });
  } else {
    res.send("No callback found");
  }
};

exports.cancel = async (req, res) => {
  res.redirect(process.env.CLIENT_URL);
};
