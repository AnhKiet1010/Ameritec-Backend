const express = require('express');
const router = express.Router();

const { checkAdmin, checkAdminPost } = require('../middlewares');

const {
    getDashboard,
    getPendingList,
    postLogin,
    getFolderView,
    editTree,
    changeTree
} = require('../controllers/admin.controller');

router.get('/dashboard', checkAdmin, getDashboard);
router.get('/getPendingList',checkAdmin, getPendingList);
router.get('/getFolderView',checkAdmin, getFolderView);
router.post('/login', postLogin);
router.post('/edit-tree',checkAdminPost, editTree);
router.post('/change-tree',checkAdminPost, changeTree);

module.exports = router;