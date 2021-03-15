require("dotenv").config({
  path: "./config/config.env",
});

const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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

app.use((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(404).json({
    success: false,
    msg: "Page not founded",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
