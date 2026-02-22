const { v4: uuidv4 } = require('uuid');
const { mockDatabase } = require('../utils/mockUsers');

exports.createItem = async (req, res) => {
  try {
    const { itemName, category, quantity, minStock, supplierName, purchaseCost, notes } = req.body;
    const status = quantity <= (minStock || 10) ? 'Low Stock' : quantity === 0 ? 'Out of Stock' : 'In Stock';
    const newItem = {
      _id: Date.now().toString(),
      itemId: `INV-${uuidv4().substr(0, 8)}`,
      itemName,
      category,
      quantity,
      minStock: minStock || 10,
      supplierName,
      purchaseCost,
      status,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.inventory.push(newItem);
    res.status(201).json({ message: 'Inventory item created successfully', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let items = mockDatabase.inventory;
    if (category) items = items.filter(i => i.category === category);
    if (status) items = items.filter(i => i.status === status);
    if (search) items = items.filter(i => i.itemName.toLowerCase().includes(search.toLowerCase()));
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = mockDatabase.inventory.find(i => i._id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.status(200).json({ item });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory item', error: error.message });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = mockDatabase.inventory.find(i => i._id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    item.quantity = quantity;
    item.status = quantity <= item.minStock ? 'Low Stock' : quantity === 0 ? 'Out of Stock' : 'In Stock';
    item.updatedAt = new Date();
    res.status(200).json({ message: 'Quantity updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Error updating quantity', error: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { itemName, category, minStock, supplierName, purchaseCost, notes } = req.body;
    const item = mockDatabase.inventory.find(i => i._id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    item.itemName = itemName || item.itemName;
    item.category = category || item.category;
    item.minStock = minStock || item.minStock;
    item.supplierName = supplierName || item.supplierName;
    item.purchaseCost = purchaseCost || item.purchaseCost;
    item.notes = notes || item.notes;
    item.updatedAt = new Date();
    res.status(200).json({ message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const index = mockDatabase.inventory.findIndex(i => i._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Inventory item not found' });
    mockDatabase.inventory.splice(index, 1);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
};

exports.getLowStockItems = async (req, res) => {
  try {
    const items = mockDatabase.inventory.filter(i => i.quantity <= i.minStock);
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};
