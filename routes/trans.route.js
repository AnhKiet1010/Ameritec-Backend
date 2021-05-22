const express = require('express');
const router = express.Router();
const { checkAdmin } = require('../middlewares');

const {getPendingList,activeTrans, getReceipts} = require('../controllers/trans.controller');


// tree system
router.get('/pending',checkAdmin, getPendingList);
router.get('/active/:id',checkAdmin, activeTrans);
router.get('/receipts', getReceipts);

module.exports = router;