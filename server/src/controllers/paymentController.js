const { v4: uuidv4 } = require('uuid');
const { mockDatabase } = require('../utils/mockUsers');

exports.createPayment = async (req, res) => {
  try {
    const { orderId, customerId, amount, paymentMethod, notes } = req.body;
    const order = mockDatabase.orders.find(o => o._id === orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    const newPayment = {
      _id: Date.now().toString(),
      paymentId: `PAY-${uuidv4().substr(0, 8)}`,
      orderId,
      customerId,
      customerName: order.customerName,
      amount,
      paymentDate: new Date(),
      paymentMethod,
      status: 'Completed',
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.payments.push(newPayment);
    res.status(201).json({ message: 'Payment recorded successfully', payment: newPayment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { status, customerId, duePayment } = req.query;
    let payments = mockDatabase.payments;
    if (status) payments = payments.filter(p => p.status === status);
    if (customerId) payments = payments.filter(p => p.customerId === customerId);
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = mockDatabase.payments.find(p => p._id === req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json({ payment });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { amount, paymentMethod, status, notes } = req.body;
    const payment = mockDatabase.payments.find(p => p._id === req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    payment.amount = amount || payment.amount;
    payment.paymentMethod = paymentMethod || payment.paymentMethod;
    payment.status = status || payment.status;
    payment.notes = notes || payment.notes;
    payment.updatedAt = new Date();
    res.status(200).json({ message: 'Payment updated successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const index = mockDatabase.payments.findIndex(p => p._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Payment not found' });
    mockDatabase.payments.splice(index, 1);
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment', error: error.message });
  }
};
