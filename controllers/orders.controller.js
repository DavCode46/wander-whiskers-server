import Order from "../models/Order.model.js";
import Product from '../models/Product.model.js'
import ErrorModel from "../models/Error.model.js"; 

const getOrders = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    next(new ErrorModel(err.message)); 
  }
};

const getOrder = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }
    const order = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    // Obtener detalles de los productos
    const productDetailsPromises = order.products.map(productId => Product.findById(productId));
    const productDetails = await Promise.all(productDetailsPromises);  
    return res.status(200).json({
      ...order.toObject(),
      products: productDetails
    });
  } catch (err) {
    next(new ErrorModel(err.message)); 
  }
};


export { getOrders, getOrder };