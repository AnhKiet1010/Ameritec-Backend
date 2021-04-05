const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});
const upload = multer({
    storage: storage
});

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
    uploadFile
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
router.post('/create-admin', createAdmin);
router.post('/uploadFile', upload.array('file'), uploadFile);

module.exports = router;