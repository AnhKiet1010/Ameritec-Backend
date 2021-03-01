const express = require('express');
const router = express.Router();

const {
    dashboard,
    tree,
    profile,
    editProfile,
    inviteUrl,
    transaction
} = require('../controllers/client.controller');

router.get('/:id', dashboard);
router.get('/tree/:id/:search', tree);
router.get('/profile/:id', profile);
router.post('/profile/edit', editProfile);
router.post('/profile/edit', editProfile);
router.get('/transaction/:id',transaction);
router.post('/referral', inviteUrl);

module.exports = router;