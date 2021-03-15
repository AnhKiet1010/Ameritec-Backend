const express = require('express');
const router = express.Router();

const { checkAdmin, checkAdminPost } = require('../middlewares');

const {
    getDashboard,
    getPendingList,
    postLogin,
    getTree,
    editTree,
    changeTree
} = require('../controllers/admin.controller');

router.get('/dashboard', getDashboard);
router.get('/getPendingList', getPendingList);
router.get('/tree/:id/:search', getTree);
router.post('/login', postLogin);
router.post('/edit-tree', editTree);
router.post('/change-tree', changeTree);

module.exports = router;