const express = require('express');
const router = express.Router();

const {
    checkout,
    callback
} = require('../controllers/payment.controller');

router.post('/checkout', checkout);
router.get('/:gateway/callback', callback);

module.exports = router;