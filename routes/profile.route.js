const express = require('express');
const router = express.Router();

const {
    getInfo,
    editInfo
} = require('../controllers/profile.controller');

router.get('/getInfo', getInfo);
router.post('/edit', editInfo);

module.exports = router;