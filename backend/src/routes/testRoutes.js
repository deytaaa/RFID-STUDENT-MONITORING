const express = require('express');
const router = express.Router();
const testController = require('../controllers/TestController');

// Clean route definitions
router.get('/models', testController.testModels);
router.get('/db', testController.testDatabase);
router.post('/sample-data', testController.createSampleData);
router.delete('/clear-data', testController.clearTestData);
router.get('/controllers', testController.testAllControllers);

module.exports = router;