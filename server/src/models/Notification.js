const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Delivery Reminder', 'Trial Reminder', 'Low Stock Alert', 'Pending Payment'],
    required: true
  },
  relatedOrderId: mongoose.Schema.Types.ObjectId,
  relatedCustomerId: mongoose.Schema.Types.ObjectId,
  relatedItemId: mongoose.Schema.Types.ObjectId,
  message: {
    type: String,
    required: true
  },
  dueDate: Date,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
