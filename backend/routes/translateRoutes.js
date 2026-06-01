const express = require('express');
const router = express.Router();
const TranslateController = require('../controllers/translateController');

/**
 * Route Configuration
 * Mount point: /api
 */

// POST /api/translate
// Translates text from source language to target language
router.post('/translate', TranslateController.translateText);

module.exports = router;
