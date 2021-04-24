const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Tree = require("../models/tree.model");

exports.helperInsert = async (req, res,) => {
    var listSugarDaddies = req.body.listSugarDaddy;
    var listdoanhnghieps = req.body.listGoiDoanhNghiep;
    var listdoanhnghiep = listdoanhnghieps.split(",");
    var list = await User.find({ id_ameritecjsc: { $ne: null } }).exec();
    
    
    for (const element of list) {
        //tạo tree
        var treeElement = await Tree.findOne({ parent: element._id }).exec();
        if (!treeElement) {
            const listSugarDaddy = listSugarDaddies.filter(({ meta_value }) => meta_value == element.id_ameritecjsc);
            const groupcon = [];
            for (const sugar of listSugarDaddy) {
                const usercon = await User.findOne({ id_ameritecjsc: sugar.user_id }).exec();
                if (usercon != null) {
                    groupcon.push(usercon._id);
                }
            }
            const tree = new Tree({
                group1: groupcon,
                group2: [],
                group3: [],
                parent: element._id,
                buy_package: listdoanhnghiep.includes(element.user_login) ? "1" : "2"
            });
            await tree.save(function (err) {
                if (err) {
                    console.log("fail to save tree!");
                }
            });
        }
        else {
            const listSugarDaddy = listSugarDaddies.filter(({ meta_value }) => meta_value == element.id_ameritecjsc);
            const groupcon = [];
            for (const sugar of listSugarDaddy) {
                const usercon = await User.findOne({ id_ameritecjsc: sugar.user_id }).exec();
                if (usercon != null) {
                    groupcon.push(usercon._id);
                }
            }
            treeElement.group1 = groupcon;
            treeElement.buy_package = listdoanhnghiep.includes(element.user_login) ? "1" : "2";
            if (element.id_ameritecjsc === '1') {

            }
            await treeElement.save(function (err) {
                if (err) {
                    console.log("fail to update tree!");
                }
            });
        }
        //tạo transaction
        var transElement = await Transaction.findOne({ email: element.email }).exec();
        if (!transElement) {
            const paramdate = new Date(element.user_registered);
            const transaction = new Transaction({
                token: "",
                status: "success",
                created_time: paramdate,
                approved_by: "ameritecjsc",
                approved_time: paramdate,
                created_by: element.full_name,
                email: element.email,
                payment_method: "tienmat",
                phone: "no have",
                buy_package: listdoanhnghiep.includes(element.user_login) ? "1" : "2",
                expired_time: new Date(paramdate.getFullYear() + 1, paramdate.getMonth(), paramdate.getDay(), paramdate.getHours(), paramdate.getMinutes(), paramdate.getMilliseconds())
            });
            await transaction.save(function (err) {
                if (err) {
                    console.log("fail to save transaction!");
                }
            });
        }
        else {
            transElement.buy_package = listdoanhnghiep.includes(element.user_login) ? "1" : "2";
            await transElement.save(function (err) {
                if (err) {
                    console.log("fail to update transaction!");
                }
            });
        }

        //làm mịn data
        element.password = "$2b$10$3HpEWjLCqQ97bg7cIuPP/OMOyr5kkzQ7zxZTczdXJH2STQPYwiA0m";
        element.avatar = "https://robohash.org/doloresutqui?size=100x100&set=set1";
        element.role = "normal";
        element.created_time = new Date(element.user_registered);
        element.buy_package = listdoanhnghiep.includes(element.user_login) ? "1" : "2";
        element.be_member = true;

        await element.save(function (err) {
            if (err) {
                console.log("fail to save users!");
            }
        });
    };
    // var list = await User.findOne({ id_ameritecjsc: "81" }).exec();
    // console.log(list.user_registered);
    res.json({
        status: 200,
        errors: [],
    });
};