const { NganLuong } = require('vn-payments');

/* eslint-disable no-param-reassign */
const nganluong = new NganLuong({
	paymentGateway: "https://sandbox.nganluong.vn:8088/nl35/checkout.api.nganluong.post.php",
	merchant: "50016",
	receiverEmail: "letrananhkiet1010@gmail.com",
	secureSecret: "2e495b9649273cc50169d22f9682e2dd",
});

exports.checkoutNganLuong = (req, res) => {
	const checkoutData = res.locals.checkoutData;
	checkoutData.returnUrl = `http://${req.headers.host}/payment/nganluong/callback`;
	checkoutData.cancelUrl = `http://${req.headers.host}`;
	checkoutData.orderInfo = 'Mua thiết bị bảo mật di động';
	checkoutData.locale = checkoutData.locale === 'en' ? 'en' : 'vi';
	checkoutData.paymentType = '1';
	checkoutData.totalItem = '1';
	console.log('checkoutData',checkoutData);

	nganluong.buildCheckoutUrl(checkoutData).then(checkoutUrl => {
		res.locals.checkoutUrl = checkoutUrl;
		return checkoutUrl;
	});
}

exports.callbackNganLuong = (req, res) => {
	const query = req.query;

	return nganluong.verifyReturnUrl(query).then(results => {
		if (results) {
			res.locals.email = results.customerEmail;
			res.locals.orderId = results.transactionId || '';
			res.locals.price = results.amount;
			res.locals.isSucceed = results.isSuccess;
			res.locals.message = results.message;
		} else {
			res.locals.isSucceed = false;
		}
	});
}