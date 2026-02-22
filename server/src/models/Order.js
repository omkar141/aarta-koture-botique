const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  dressType: {
    type: String,
    required: true
  },
  fabricType: {
    type: String,
    required: true
  },
  orderDate: {
    type: Date,
    required: true
  },
  trialDate: {
    type: Date
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'In Stitching', 'Trial Done', 'Alteration', 'Ready', 'Delivered'],
    default: 'New'
  },
  notes: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timeline: [
    {
      status: String,
      date: {
        type: Date,
        default: Date.now
      },
      notes: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
