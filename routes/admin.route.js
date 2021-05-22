const express = require('express');
const router = express.Router();

const { checkAdmin } = require('../middlewares');

const {
    getDashboard,
    getPendingList,
    getTree,
    editTree,
    changeTree,
    getUser,
    getStorage,
    createAdmin,
    createPolicy,
    policy,
    helperInsert,
    helperInsertCalLevel,
    editUser,
    getReceipts
} = require('../controllers/admin.controller');

router.post('/helperInsert', helperInsert);
router.post('/helperInsertCalLevel', helperInsertCalLevel);
router.get('/dashboard',checkAdmin, getDashboard);
router.get('/storage', checkAdmin, getStorage);
router.get('/user/:id', checkAdmin, getUser);
router.post('/user/edit/:id', editUser);
router.get('/getPendingList', checkAdmin, getPendingList);
router.get('/tree/:id/:search/:page',checkAdmin,  getTree);
router.post('/edit-tree', editTree);
router.post('/change-tree', changeTree);
router.post('/create-admin', createAdmin);
router.post('/create-policy', createPolicy);
router.get('/receipts',checkAdmin, getReceipts);
router.get('/policy',checkAdmin, policy);

module.exports = router;