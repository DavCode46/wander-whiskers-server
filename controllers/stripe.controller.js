import Cart from "../models/Cart.model.js";
import User from "../models/User.model.js";
import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.SECRET_STRIPE_KEY);

const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const rawBody = req.body;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.ENCPOINT_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const metadata = session.metadata;
      const userId = metadata.user_id;

      if (!userId) {
        console.error(
          "ID de usuario no encontrado en los metadatos de la sesión de checkout"
        );
        return res
          .status(400)
          .json({
            message:
              "ID de usuario no encontrado en los metadatos de la sesión de checkout",
          });
      }

      try {
        const user = await User.findById(userId).populate("cart");

        if (!user) {
          console.error("Usuario no encontrado en la base de datos");
          return res
            .status(404)
            .json({ message: "Usuario no encontrado en la base de datos" });
        }

        for (const cartItem of user.cart) {
          for (const productId of cartItem.products) {
            const product = await Product.findById(productId);
            if (product) {
              await Order.create({
                products: product,
                user: userId,
              });
            } else {
              console.error(`Producto con ID ${productId} no encontrado`);
            }
          }
        }

        // Vaciar el carrito del usuario después de crear las órdenes
        user.cart = [];
        user.isSubscribed = true;
        await user.save();

        // Eliminar el carrito de la base de datos
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
          await Cart.findByIdAndDelete(cart._id);
        }

        // Responder al webhook con un estado 200 OK
        return res.sendStatus(200);
      } catch (error) {
        console.error("Error al manejar checkout.session.completed:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
      }
      break;

    default:
      return res.sendStatus(200); // Responder con 200 OK para otros tipos de eventos no manejados
  }
};

export default stripeWebhook;
