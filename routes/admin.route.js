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
    getUserExpired
} = require('../controllers/admin.controller');

//const { helperInsert } = require('../controllers/inser.data');

router.post('/helperInsert', helperInsert);
router.get('/getUserExpired', getUserExpired);
router.get('/dashboard', getDashboard);
router.get('/storage', getStorage);
router.get('/user/:id', getUser);
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