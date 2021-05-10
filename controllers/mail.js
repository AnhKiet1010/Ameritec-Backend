"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
exports.Mail = async (email, html, subject) => {

  // create reusable transporter object using the default SMTP transport
  // let transporter = nodemailer.createTransport({
  //   pool: true,
  //   host: "smtp.gmail.com",
  //   port: 465,
  //   secure: true, // use TLS
  //   auth: {
  //     user: process.env.AMERITEC_EMAIL,
  //     pass: process.env.AMERITEC_EMAIL_PASS
  //   }
  // });

  let transporter = nodemailer.createTransport({
    pool: true,
    host: "sv3.tmail.vn",
    port: 587,
    secure: false, // use TLS
    auth: {
      user: process.env.AMERITEC_EMAIL,
      pass: process.env.AMERITEC_EMAIL_PASS
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"AMERITEC" <info@ameritecjsc.com>', // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    html: html, // html body
  });

  return info;
}