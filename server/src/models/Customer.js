const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  shoulder: { type: Number },
  bust: { type: Number },
  waist: { type: Number },
  hip: { type: Number },
  sleeveLength: { type: Number },
  dressLength: { type: Number },
  notes: { type: String },
  recordedAt: {
    type: Date,
    default: Date.now
  }
});

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    match: /.+\@.+\..+/
  },
  address: {
    type: String
  },
  measurements: [measurementSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

customerSchema.index({ name: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
