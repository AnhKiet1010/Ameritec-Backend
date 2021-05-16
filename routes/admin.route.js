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
    getStorage,
    createAdmin,
    createPolicy,
    policy,
    helperInsert,
    helperInsertCalLevel,
    editUser,
} = require('../controllers/admin.controller');

router.post('/helperInsert', helperInsert);
router.post('/helperInsertCalLevel', helperInsertCalLevel);
router.get('/dashboard', getDashboard);
router.get('/storage', getStorage);
router.get('/user/:id', getUser);
router.post('/user/edit/:id', editUser);
router.get('/getPendingList', getPendingList);
router.get('/tree/:id/:search', getTree);
router.post('/login', postLogin);
router.post('/update-admin/:id', updateAdmin);
router.post('/edit-tree', editTree);
router.post('/change-tree', changeTree);
router.post('/create-admin', createAdmin);
router.post('/create-policy', createPolicy);
router.get('/policy', policy);

module.exports = router;