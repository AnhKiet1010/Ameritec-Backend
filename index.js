require("dotenv").config({
  path: "./config/config.env",
});

const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const CronJob = require("cron").CronJob;
const aws = require('aws-sdk');
const email = "ameritec110919@gmail.com";

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + '/config.json');

// Instantiate SES.
const ses = new aws.SES();

const app = express();

app.use(cookieParser());

const connectDB = require("./config/db");

// body parser
app.use(
  bodyParser.json({
    json: { limit: "200mb", extended: true },
    urlencoded: { limit: "200mb", extended: true },
  })
);

// Dev Login Middleware
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("success");
});
app.get('/send', function (req, res) {
  var ses_mail = "From: 'AWS Tutorial Series' <" + email + ">\n";
  ses_mail = ses_mail + "To: " + email + "\n";
  ses_mail = ses_mail + "Subject: AWS SES Attachment Example\n";
  ses_mail = ses_mail + "MIME-Version: 1.0\n";
  ses_mail = ses_mail + "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n";
  ses_mail = ses_mail + "--NextPart\n";
  ses_mail = ses_mail + "Content-Type: text/html; charset=us-ascii\n\n";
  ses_mail = ses_mail + "This is the body of the email.\n\n";
  ses_mail = ses_mail + "--NextPart\n";
  ses_mail = ses_mail + "Content-Type: text/plain;\n";
  ses_mail = ses_mail + "Content-Disposition: attachment; filename=\"attachment.txt\"\n\n";
  ses_mail = ses_mail + "AWS Tutorial Series - Really cool file attachment!" + "\n\n";
  ses_mail = ses_mail + "--NextPart--";

  var params = {
    RawMessage: { Data: new Buffer(ses_mail) },
    Destinations: ["letrananhkiet1010@gmail.com"],
    Source: "'AWS Tutorial Series' <" + email + ">'"
  };

  ses.sendRawEmail(params, function (err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

app.use(express.static("public"));

