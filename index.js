require("dotenv").config({
  path: "./config/config.env",
});

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const CronJob = require("cron").CronJob;

const app = express();

const connectDB = require("./config/db");



// parse application/x-www-form-urlencoded
// app.use(express.json());

// parse application/json
app.use(express.json({ limit: '50mb', extended: true }));

// Dev Login Middleware
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("success");
});

app.get('/list', function (req, res) {
  ses.listVerifiedEmailAddresses(function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});
// Verify email addresses.
app.get('/verify', function (req, res) {
  var params = {
    EmailAddress: email
  };

  ses.verifyEmailAddress(params, function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});

const authRouter = require("./routes/auth.route");
app.use("/api/auth", authRouter);

const treeRouter = require("./routes/tree.route");
app.use("/tree", treeRouter);

const transRouter = require("./routes/trans.route");
app.use("/trans", transRouter);

const adminRouter = require("./routes/admin.route");
app.use("/admin", adminRouter);

const clientRouter = require("./routes/client.route");
app.use("/client", clientRouter);

const paymentRouter = require("./routes/payment.route");
app.use("/payment", paymentRouter);

// Connect to database
connectDB();

const { deletePendingTransactions, setExpiredUser } = require("./config/cron");

const cron1 = new CronJob("5 * * * *", () => {
  console.log("Running delete pending transaction");
  deletePendingTransactions();
});

const cron2 = new CronJob("00 00 * * *", () => {
  console.log("Running set expired user");
  setExpiredUser();
});

cron1.start();
cron2.start();

app.use(express.static("public"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});



