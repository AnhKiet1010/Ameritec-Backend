const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

const {
    dashboard,
    tree,
    profile,
    upgrade,
    editProfile,
    inviteUrl,
    transaction,
    policy
} = require('../controllers/client.controller');

router.get('/:id', dashboard);
router.get('/tree/:id/:search', tree);
router.post('/upgrade', upload.fields([{ name: 'CMND_Front', maxCount: 1 }, { name: 'CMND_Back', maxCount: 1 }]), upgrade);
router.get('/profile/:id', profile);
router.post('/profile/edit', editProfile);
router.get('/transaction/:id',transaction);
router.post('/referral', inviteUrl);
router.get('/policy/:id', policy);

module.exports = router;