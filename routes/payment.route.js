const express = require('express');
const router = express.Router();

const {
    checkout,
    callback,
    cancel
} = require('../controllers/payment.controller');

router.post('/checkout', checkout);
router.get('/:gateway/callback', callback);
router.get('/cancel', cancel);

module.exports = router;