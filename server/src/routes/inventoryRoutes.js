const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', inventoryController.createItem);
router.get('/', inventoryController.getAllItems);
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/:id', inventoryController.getItemById);
router.put('/:id', inventoryController.updateItem);
router.patch('/:id/quantity', inventoryController.updateQuantity);
router.delete('/:id', inventoryController.deleteItem);

module.exports = router;
