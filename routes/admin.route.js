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
    createAdmin
} = require('../controllers/admin.controller');

router.get('/dashboard', getDashboard);
router.get('/user/:id', getUser);
router.get('/getPendingList', getPendingList);
router.get('/tree/:id/:search', getTree);
router.post('/login', postLogin);
router.post('/update-admin/:id', updateAdmin);
router.post('/edit-tree', editTree);
router.post('/change-tree', changeTree);
router.post('/create-admin', createAdmin);

module.exports = router;