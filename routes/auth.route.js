const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

const {
    registerController,
    activationController,
    loginController,
    forgotPasswordController,
    resetPasswordController,
    loginRequest,
    checkLinkController,
} = require('../controllers/auth.controller');

// auth route
router.post('/register', upload.fields([{ name: 'CMND_Front', maxCount: 1 }, { name: 'CMND_Back', maxCount: 1 }]), registerController);
router.post('/activation', activationController);
router.post('/login', loginController);
router.post('/checkLink', checkLinkController);



// login route
router.get('/signInRequest', loginRequest);

// forgot reset password
router.post('/forgotpassword', forgotPasswordController);
router.post('/resetpassword', resetPasswordController);

module.exports = router;