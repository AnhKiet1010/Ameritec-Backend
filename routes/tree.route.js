const express = require('express');
const router = express.Router();

const { subUserList, subTreeList, folderView, test } = require('../controllers/tree.controller');


// tree system
router.get('/sub-user-list', subUserList);
router.get('/get-tree', subTreeList);
router.get('/get-folder-view', folderView);
router.get('/test', test);

module.exports = router;