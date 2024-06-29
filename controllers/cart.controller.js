import Cart from "../models/Cart.model.js";
import User from "../models/User.model.js";
import ErrorModel from "../models/Error.model.js";
import Product from "../models/Product.model.js";

import dotenv from "dotenv";
dotenv.config();
const {
  CLIENT_URL_SUCCESS,
  CLIENT_URL_CANCEL,
  SECRET_STRIPE_KEY,
  STRIPE_MONTHLY_SUBSCRIPTION,
  STRIPE_ANNUAL_SUBSCRIPTION,
} = process.env;


import Stripe from "stripe";

const stripe = new Stripe(SECRET_STRIPE_KEY);

const getProductsCart = async (req, res, next) => {
  // Get the products in the cart
  try {
    const userId = req.params.id;
   
    const productsCart = await Cart.find({ user: userId });
   
    if (!productsCart)
      return next(new ErrorModel("No hay productos en el carro"));
    return res.status(200).json(productsCart);
  } catch (err) {
    return next(new ErrorModel(err));
  }
};

const addProductCart = async (req, res, next) => {
  const userId = req.params.id;
 
  const { productId } = req.body;
  try {
    // Buscar el carrito del usuario
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      // Si el usuario no tiene un carrito, crear uno nuevo
      cart = await Cart.create({ user: userId, products: [productId] });   
      // También actualiza el campo 'cart' del usuario
      const user = await User.findById(userId);   
      user.cart = cart;
      await user.save();
      return res.status(201).json({ message: "Producto agregado al carrito" });
    } else {
      // Verificar si el producto ya está presente en el carrito
      if (!cart.products.length) {
        // Si el producto no está en el carrito, agregarlo
        cart.products.push(productId);
        await cart.save();
        return res.status(201).json({ message: "Producto agregado al carrito" });
      } else {
        // Si el producto ya está en el carrito, responder con un error
        res
          .status(400)
          .json({
            message:
              "Solo se puede seleccionar una suscripción, vacía tu carrito",
          });
      }
    }
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
};

const updateProductCart = async (req, res, next) => {
  // Extraer el ID del usuario autenticado desde la solicitud
  const userId = req.user.id;

  // Extraer el ID del producto que se va a actualizar y los detalles actualizados del producto del cuerpo de la solicitud
  const { productId, updatedProduct } = req.body;

  try {
    // Buscar el usuario por su ID
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorModel("Usuario no encontrado"));
    }

    // Buscar el índice del producto en el carrito del usuario
    const productIndex = user.cart.findIndex(
      (product) => product._id.toString() === productId
    );

    if (productIndex === -1) {
      return next(new ErrorModel("Producto no encontrado en el carrito"));
    }

    // Actualizar los detalles del producto en el carrito del usuario
    user.cart[productIndex].set(updatedProduct);

    // Guardar los cambios en el usuario (con el producto actualizado en el carrito)
    await user.save();

    // Responder con el producto actualizado en el carrito
    return res.status(200).json({
      message: "Producto actualizado en el carrito",
      product: user.cart[productIndex],
    });
  } catch (error) {
    // Manejar errores
    console.error(error);
    return next(new ErrorModel(error));
  }
};

const deleteProductCart = async (req, res, next) => {
  // Extraer el ID del usuario autenticado desde la solicitud
  const userId = req.user.id;
  // Extraer el ID del producto que se va a eliminar del parámetro de la solicitud
  const productId = req.params.productId;
  try {
    // Buscar el carrito del usuario
    const userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      return next(new ErrorModel("Error al encontrar el carrito"));
    }
    // Eliminar el producto del array de productos del carrito
    userCart.products.pull(productId);
    if (userCart.products.length === 0) {
      const updatedUser = await User.findById(userId);
      await Cart.findByIdAndDelete(userCart);
      updatedUser.cart = userCart.products;
      await updatedUser.save();
    } else {
      // Guardar los cambios en el carrito
      await userCart.save();
    }
    // Responder con un mensaje de éxito y el carrito actualizado
    res
      .status(200)
      .json({
        message: "Producto eliminado del carrito, carrito actualizado",
        cart: userCart,
      });
  } catch (error) {
    // Manejar errores
    console.error(error);
    return next(new ErrorModel(error));
  }
};


const checkout = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).populate("cart");
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const lineItems = [];
    
    for (const cartItem of user.cart) {
      for (const productId of cartItem.products) {
        const product = await Product.findById(productId);
        lineItems.push({
          price: product.name === "Mensual" ? STRIPE_MONTHLY_SUBSCRIPTION : STRIPE_ANNUAL_SUBSCRIPTION,
          quantity: 1,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "paypal"],
      line_items: lineItems,
      mode: "subscription",
      success_url: `${CLIENT_URL_SUCCESS}`,
      cancel_url: `${CLIENT_URL_CANCEL}`,
      client_reference_id: userId,
      metadata: {
        user_id: userId, // Pasa el userId como metadata
      }
      
    });
    

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return next(new ErrorModel(error));
  }
  
};


export {
  getProductsCart,
  addProductCart,
  updateProductCart,
  deleteProductCart,
  checkout,
};
