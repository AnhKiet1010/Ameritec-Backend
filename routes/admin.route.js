const express = require('express');
const router = express.Router();

const { checkAdmin } = require('../middlewares');

const {
    getDashboard,
    getPendingList,
    getTree,
    editTree,
    getUser,
    getStorage,
    createAdmin,
    createPolicy,
    policy,
    helperInsert,
    helperInsertCalLevel,
    editUser,
    getReceipts,
    checkLevel
} = require('../controllers/admin.controller');

router.post('/helperInsert', helperInsert);
router.post('/helperInsertCalLevel', helperInsertCalLevel);
router.get('/dashboard', checkAdmin, getDashboard);
router.get('/storage', checkAdmin, getStorage);
router.get('/user/:id', checkAdmin, getUser);
router.post('/user/edit/:id', editUser);

router.get('/getPendingList', getPendingList);
router.get('/tree/:id/:search/:page', getTree);
router.post('/edit-tree', checkAdmin, editTree);

router.post('/create-admin', createAdmin);
router.post('/create-policy', createPolicy);
router.get('/receipts', checkAdmin, getReceipts);
router.get('/policy', checkAdmin, policy);

router.post('/checkLevel', checkLevel);

module.exports = router;