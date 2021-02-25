const express = require('express');
const router = express.Router();

const {
    dashboard,
    tree,
    profile,
    editProfile
} = require('../controllers/client.controller');

router.get('/:id', dashboard);
router.get('/tree/:id/:search', tree);
router.get('/profile/:id', profile);
router.post('/profile/edit', editProfile);

module.exports = router;