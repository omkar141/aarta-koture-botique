const express = require('express');
const customerController = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', customerController.createCustomer);
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.post('/:id/measurements', customerController.addMeasurement);
router.get('/:id/orders', customerController.getOrderHistory);

module.exports = router;
