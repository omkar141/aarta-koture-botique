const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemId: {
    type: String,
    unique: true,
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Fabric', 'Lace', 'Button', 'Thread', 'Zipper', 'Other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  minStock: {
    type: Number,
    default: 10
  },
  supplierName: String,
  purchaseCost: Number,
  lastRestocked: Date,
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

inventorySchema.methods.isLowStock = function() {
  return this.quantity <= this.minStock;
};

module.exports = mongoose.model('Inventory', inventorySchema);
