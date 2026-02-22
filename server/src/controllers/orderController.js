const { v4: uuidv4 } = require('uuid');
const { mockDatabase } = require('../utils/mockUsers');

exports.createOrder = async (req, res) => {
  try {
    const { customerId, garmentType, color, description, orderDate, dueDate, totalAmount, advanceAmount, notes } = req.body;
    const customer = mockDatabase.customers.find(c => c._id === customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const newOrder = {
      _id: Date.now().toString(),
      orderId: `ORD-${uuidv4().substr(0, 8)}`,
      customerId,
      customerName: customer.name,
      garmentType,
      color,
      description,
      orderDate,
      dueDate,
      totalAmount,
      advanceAmount,
      status: 'New',
      staffAssignedTo: null,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.orders.push(newOrder);
    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, customerId } = req.query;
    let orders = mockDatabase.orders;
    if (status) orders = orders.filter(o => o.status === status);
    if (customerId) orders = orders.filter(o => o.customerId === customerId);
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = mockDatabase.orders.find(o => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { garmentType, color, description, dueDate, notes } = req.body;
    const order = mockDatabase.orders.find(o => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.garmentType = garmentType || order.garmentType;
    order.color = color || order.color;
    order.description = description || order.description;
    order.dueDate = dueDate || order.dueDate;
    order.notes = notes || order.notes;
    order.updatedAt = new Date();
    res.status(200).json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

exports.changeOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = mockDatabase.orders.find(o => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    order.notes = notes || order.notes;
    order.updatedAt = new Date();
    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

exports.assignOrder = async (req, res) => {
  try {
    const { staffId } = req.body;
    const order = mockDatabase.orders.find(o => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.staffAssignedTo = staffId;
    order.updatedAt = new Date();
    res.status(200).json({ message: 'Order assigned successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning order', error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const index = mockDatabase.orders.findIndex(o => o._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Order not found' });
    mockDatabase.orders.splice(index, 1);
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};
