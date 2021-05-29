const express = require('express');
const router = express.Router();

const {
    registerController,
    activationController,
    loginController,
    forgotPasswordController,
    resetPasswordController,
    checkLinkController
} = require('../controllers/auth.controller');

// auth route
router.post('/register', registerController);
router.post('/activation', activationController);
router.post('/login', loginController);
router.post('/checkLink', checkLinkController);

// forgot reset password
router.post('/forgotpassword', forgotPasswordController);
router.post('/resetpassword', resetPasswordController);

module.exports = router;