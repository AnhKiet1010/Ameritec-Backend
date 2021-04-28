const express = require('express');
const router = express.Router();

const {getPendingList,activeTrans, getReceipts, getAdminReceipts, testMail} = require('../controllers/trans.controller');


// tree system
router.get('/pending', getPendingList);
router.get('/active/:id', activeTrans);
router.get('/receipts', getReceipts);
router.get('/admin-receipts', getAdminReceipts);

router.get('/testMail', testMail)

module.exports = router;