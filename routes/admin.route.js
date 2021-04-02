const express = require('express');
const router = express.Router();

const { checkAdmin, checkAdminPost } = require('../middlewares');

const {
    getDashboard,
    getPendingList,
    postLogin,
    getTree,
    editTree,
    changeTree,
    getUser,
    updateAdmin,
    getStorage
} = require('../controllers/admin.controller');

router.get('/dashboard', getDashboard);
router.get('/storage', getStorage);
router.get('/user/:id', getUser);
router.get('/getPendingList', getPendingList);
router.get('/tree/:id/:search', getTree);
router.post('/login', postLogin);
router.post('/update-admin/:id', updateAdmin);
router.post('/edit-tree', editTree);
router.post('/change-tree', changeTree);

module.exports = router;