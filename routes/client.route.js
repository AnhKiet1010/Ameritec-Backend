const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { checkClient } = require('../middlewares');

const {
    dashboard,
    tree,
    profile,
    upgrade,
    editProfile,
    inviteUrl,
    receipts,
    policy
} = require('../controllers/client.controller');

router.get('/:id', checkClient, dashboard);
router.get('/tree/:id/:search', checkClient, tree);
router.post('/upgrade', upload.fields([{ name: 'CMND_Front', maxCount: 1 }, { name: 'CMND_Back', maxCount: 1 }]), upgrade);
router.get('/profile/:id', checkClient, profile);
router.post('/profile/edit', editProfile);
router.get('/receipts/:id',checkClient, receipts);
router.post('/referral',checkClient, inviteUrl);
router.get('/policy/:id',checkClient, policy);

module.exports = router;