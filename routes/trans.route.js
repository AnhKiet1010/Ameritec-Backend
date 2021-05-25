const express = require('express');
const router = express.Router();
const { checkAdmin } = require('../middlewares');

const { activeTrans } = require('../controllers/trans.controller');


// tree system
router.get('/active/:id',checkAdmin, activeTrans);

module.exports = router;