const { v4: uuidv4 } = require('uuid');
const { mockDatabase } = require('../utils/mockUsers');

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const newCustomer = {
      _id: Date.now().toString(),
      customerId: `CUST-${uuidv4().substr(0, 8)}`,
      name,
      phone,
      email,
      address,
      measurements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDatabase.customers.push(newCustomer);
    res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
  } catch (error) {
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let customers = mockDatabase.customers;
    if (search) {
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
      );
    }
    res.status(200).json({ customers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = mockDatabase.customers.find(c => c._id === req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json({ customer });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const customer = mockDatabase.customers.find(c => c._id === req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    customer.name = name;
    customer.phone = phone;
    customer.email = email;
    customer.address = address;
    customer.updatedAt = new Date();
    res.status(200).json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const index = mockDatabase.customers.findIndex(c => c._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Customer not found' });
    mockDatabase.customers.splice(index, 1);
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};

exports.addMeasurement = async (req, res) => {
  try {
    const { shoulder, bust, waist, hip, sleeveLength, dressLength, notes } = req.body;
    const customer = mockDatabase.customers.find(c => c._id === req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    customer.measurements.push({
      shoulder,
      bust,
      waist,
      hip,
      sleeveLength,
      dressLength,
      notes,
      recordedAt: new Date()
    });
    customer.updatedAt = new Date();
    res.status(201).json({ message: 'Measurement added successfully', customer });
  } catch (error) {
    res.status(500).json({ message: 'Error adding measurement', error: error.message });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const orders = mockDatabase.orders.filter(o => o.customerId === req.params.id);
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order history', error: error.message });
  }
};
