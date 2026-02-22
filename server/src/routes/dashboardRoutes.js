const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/owner', roleMiddleware(['admin']), dashboardController.getOwnerDashboard);
router.get('/staff', roleMiddleware(['staff']), dashboardController.getStaffDashboard);
router.get('/reports', roleMiddleware(['admin', 'accountant']), dashboardController.getReports);

module.exports = router;
