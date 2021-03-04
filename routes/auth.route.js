const express = require('express');
const router = express.Router();
const multer  = require('multer');

// UPLOAD IMAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/upload');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (
            file.mimetype == "image/bmp" ||
            file.mimetype == "image/png" ||
            file.mimetype == "image/gif" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/jpeg"
        ) {
            cb(null, true);
            console.log('avatar saved');
        } else {
            return cb(new Error("only image are allowed!"));
        }
    }
});

const {
    registerController,
    createAccountController,
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
router.post('/register', registerController);
router.post('/create-account', createAccountController);
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