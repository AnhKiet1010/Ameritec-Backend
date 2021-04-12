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
  const { token, email, created_by, package_buy, phone } = trans;

  const emailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "[AMERITEC] ĐƯỜNG DẪN KÍCH HOẠT TÀI KHOẢN",
    html: `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mail</title>
</head>
<body>
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
    </body>
</html>
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

  res.json({ commissionSuccess, commissionPending });
}