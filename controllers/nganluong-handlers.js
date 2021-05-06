const { NganLuong } = require('vn-payments');

/* eslint-disable no-param-reassign */
const nganluong = new NganLuong({
	paymentGateway: "https://sandbox.nganluong.vn:8088/nl35/checkout.api.nganluong.post.php",
	merchant: "50240",
	receiverEmail: "ameritec110919@gmail.com",
	secureSecret: "90d142d2d308437155eb5cd2f5b6f2df",
});

exports.checkoutNganLuong = (req, res) => {
	const checkoutData = res.locals.checkoutData;
	checkoutData.returnUrl = `http://${req.headers.host}/payment/nganluong/callback`;
	checkoutData.cancelUrl = `http://${req.headers.host}/payment/cancel`;
	checkoutData.orderInfo = 'Mua thiết bị bảo mật di động';
	checkoutData.locale = checkoutData.locale === 'en' ? 'en' : 'vi';
	checkoutData.paymentType = '1';
	checkoutData.totalItem = '1';

	return nganluong.buildCheckoutUrl(checkoutData).then(checkoutUrl => {
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
