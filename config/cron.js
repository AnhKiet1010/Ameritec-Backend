const Transaction = require("./models/transaction.model");

async function deletePendingTransactions() {
    await Transaction.deleteMany({ email, status: "pending" }).exec();
}

async function setExpiredUser() {
    await Transaction.deleteMany({ email, status: "pending" }).exec();
}