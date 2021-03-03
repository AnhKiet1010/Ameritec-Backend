const {
  checkoutNganLuong,
  callbackNganLuong,
} = require("./nganluong-handlers");
const Transaction = require("../models/transaction.model");

exports.checkout = async (req, res) => {
  console.log("body", req.body);
  const { email, payment_method } = req.body;
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
      currency: "USD",
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
        checkoutData.paymentMethod = "NL";
        checkoutData.bankCode = "ATM_ONLINE";
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
        .then((checkoutUrl) => {
        console.log("checkoutUrl",checkoutUrl);
          res.writeHead(301, { Location: checkoutUrl.href });
          res.end();
        })
        .catch((err) => {
          res.send(err.message);
        });
    } else {
      res.send("Payment method not found");
    }
  } else if (payment_method === "tienmat") {
    await Transaction.findOneAndUpdate(
      { email },
      { payment_method: "tienmat" }
    ).exec();
    res.send("trả tiền mặt");
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
      res.render("result", {
        title: `Ameritec ${gateway.toUpperCase()}`,
        isSucceed: res.locals.isSucceed,
        email: res.locals.email,
        orderId: res.locals.orderId,
        price: res.locals.price,
        message: res.locals.message,
        billingStreet: res.locals.billingStreet,
        billingCountry: res.locals.billingCountry,
        billingCity: res.locals.billingCity,
        billingStateProvince: res.locals.billingStateProvince,
        billingPostalCode: res.locals.billingPostalCode,
      });
    });
  } else {
    res.send("No callback found");
  }
};
