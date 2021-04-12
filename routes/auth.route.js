const express = require('express');
const router = express.Router();
const multer = require('multer');

// UPLOAD IMAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {        
        cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        console.log("file", file);
        cb(null,"IMAGE-" + Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log("aaaaaaaaaaaaaaa");
        if (
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/jpeg"
        ) {
            cb(null, console.log("image saved"));
        } else {
            return cb(new Error("only image are allowed!"));
        }
    }
});

const {
    registerController,
    activationController,
    loginController,
    forgotPasswordController,
    resetPasswordController,
    userInfoController,
    loginRequest,
    addDemoData,
    checkLinkController
} = require('../controllers/auth.controller');

// auth route
router.post('/register',upload.fields([{name: 'cmndMT'}]), registerController);
router.post('/activation', activationController);
router.post('/login', loginController);
router.post('/user-info', userInfoController);
router.post('/checkLink', checkLinkController);


// login route
router.get('/signInRequest', loginRequest);

// add demo data
router.get('/addDemoData', addDemoData);

// forgot reset password
router.post('/forgotpassword', forgotPasswordController);
router.post('/resetpassword', resetPasswordController);

module.exports = router;