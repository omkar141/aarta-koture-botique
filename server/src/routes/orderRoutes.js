const express = require('express');
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
router.patch('/:id/status', orderController.changeOrderStatus);
router.patch('/:id/assign', orderController.assignOrder);

module.exports = router;
