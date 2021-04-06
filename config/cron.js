const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const moment = require("moment");

exports.deletePendingTransactions = async () => {
    var listTrans = await Transaction.find({ status: "pending" }).exec();
    listTrans.forEach(element => {
        element.created_time = new Date(element.created_time);
    });
    const date = new Date();
    var kq = [];
    for (let i = 0; i < listTrans.length; i++) {
        if (new Date(listTrans[i].created_time) > new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() - 5)) {
            kq.push(listTrans[i]._id);
        }
    }
    await Transaction.deleteMany({ $pullAll: { _id: kq } }).exec();
    //await Transaction.deleteMany({ status: "pending" }).exec();
}

exports.setExpiredUser = async () => {

    const listUser = await User.find().exec();

    const listExpiredUser = listUser.filter(user => {
        const nowDate = new Date(user.created_time);
        return moment().diff(moment(nowDate), "years") >= 1
    });

    if (listExpiredUser.length > 0) {
        for (user of listExpiredUser) {
            await User.findOneAndUpdate({ _id: user._id }, { expired: true });
        }
    }

}