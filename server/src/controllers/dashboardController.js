const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

exports.getOwnerDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: { $ne: 'Delivered' } });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const todayDeliveries = await Order.countDocuments({ deliveryDate: { $gte: today, $lt: tomorrowStart }, status: { $ne: 'Delivered' } });

    const monthlyRevenue = await Payment.aggregate([
      { $match: { paymentDate: { $gte: startOfMonth, $lte: endOfMonth }, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$advancePaid' } } }
    ]);

    const pendingPayments = await Payment.find({ status: { $in: ['Pending', 'Partial'] } });

    res.status(200).json({
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        todayDeliveries,
        monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
        pendingPaymentsCount: pendingPayments.length,
        pendingPaymentsAmount: pendingPayments.reduce((sum, p) => sum + p.balanceAmount, 0),
        totalCustomers: await Customer.countDocuments(),
        lowStockItems: await Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$minStock'] } })
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

exports.getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user.id;
    const assignedOrders = await Order.find({ assignedTo: staffId }).populate('customerId', 'name phone');
    const pendingAssignedOrders = await Order.countDocuments({ assignedTo: staffId, status: { $ne: 'Delivered' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const todayWork = await Order.find({ assignedTo: staffId, trialDate: { $gte: today, $lt: tomorrowStart } }).populate('customerId', 'name phone');
    const deliveryReminders = await Order.find({ assignedTo: staffId, deliveryDate: { $gte: today, $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) }, status: { $ne: 'Delivered' } }).populate('customerId', 'name phone');

    res.status(200).json({
      stats: { totalAssignedOrders: assignedOrders.length, pendingAssignedOrders, todayWorkCount: todayWork.length, deliveryRemindersCount: deliveryReminders.length },
      assignedOrders,
      todayWork,
      deliveryReminders
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff dashboard', error: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { reportType, month, quarter, year } = req.query;

    if (reportType === 'revenue') {
      const monthNum = month ? parseInt(month) : new Date().getMonth() + 1;
      const yearNum = year ? parseInt(year) : new Date().getFullYear();
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);
      const revenue = await Payment.aggregate([
        { $match: { paymentDate: { $gte: startDate, $lte: endDate }, status: 'Completed' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } }, total: { $sum: '$advancePaid' } } },
        { $sort: { _id: 1 } }
      ]);
      return res.status(200).json({ reportType: 'revenue', data: revenue });
    }

    if (reportType === 'pendingPayments') {
      const pendingPayments = await Payment.find({ status: { $in: ['Pending', 'Partial'] } }).populate('customerId', 'name phone').populate('orderId', 'orderId dressType');
      return res.status(200).json({ reportType: 'pendingPayments', data: pendingPayments });
    }

    if (reportType === 'delivery') {
      const monthNum = month ? parseInt(month) : new Date().getMonth() + 1;
      const yearNum = year ? parseInt(year) : new Date().getFullYear();
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);
      const deliveries = await Order.find({ deliveryDate: { $gte: startDate, $lte: endDate }, status: 'Delivered' }).populate('customerId', 'name phone');
      return res.status(200).json({ reportType: 'delivery', data: deliveries });
    }

    if (reportType === 'staffWorkload') {
      const staff = await User.find({ role: 'staff' });
      const workload = await Promise.all(staff.map(async (s) => ({
        staffId: s._id,
        staffName: s.name,
        totalOrders: await Order.countDocuments({ assignedTo: s._id }),
        completedOrders: await Order.countDocuments({ assignedTo: s._id, status: 'Delivered' }),
        pendingOrders: await Order.countDocuments({ assignedTo: s._id, status: { $ne: 'Delivered' } })
      })));
      return res.status(200).json({ reportType: 'staffWorkload', data: workload });
    }

    res.status(400).json({ message: 'Invalid report type' });
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};
