const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const moment = require("moment");

exports.deletePendingTransactions = async () => {
    await Transaction.deleteMany({ status: "pending" }).exec();
}

exports.setExpiredUser = async () => {

    const listUser = await User.find().exec();
    
    const listExpiredUser = listUser.filter(user => {
        const nowDate = new Date(user.created_time);
        return moment().diff(moment(nowDate), "years") >= 1
    } );

    if(listExpiredUser.length > 0) {
        for(user of listExpiredUser) {
            await User.findOneAndUpdate({_id: user._id}, {expired: true});
        }
    }

}