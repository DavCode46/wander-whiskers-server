import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import upload from "express-fileupload";
import fs from "fs";
import userRoutes from "./routes/user.routes.js";
import postsRoutes from "./routes/posts.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import productRoutes from "./routes/products.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import compression from "compression";

import { fileURLToPath } from "url";
import { dirname } from "path";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(compression({
  level: 6, // Nivel de compresión (0-9)
  threshold: 1024, // Umbral en bytes a partir del cual se comprimen las respuestas
  filter: (req, res) => {
      if (req.headers['x-no-compression']) {
          // No comprime las respuestas si el cliente envía este encabezado
          return false;
      }
      // Comprueba el tipo de contenido y decide si comprimir o no
      return compression.filter(req, res);
  }
}));



// Remove the trailing slash if there is any

const allowedOrigins = [
  "https://wander-whiskers-client.onrender.com",
  "https://www.wander-whiskers.eu",
  "http://www.wander-whiskers.eu",
  "https://wander-whiskers.eu",
  "http://wander-whiskers.eu",
  "http://localhost:5173", // Origen localhost client para pruebas
  "http://localhost:5000", // Origen localhost api para pruebas
  "https://api.stripe.com", // Origen de stripe
  "https://js.stripe.com", // Origen de stripe
  "https://r.stripe.com", // Origen de stripe
  "https://api2.hcaptcha.com", // Origen de hcaptcha
  "https://newassets.hcaptcha.com", // Origen de hcaptcha
];

// Configura CORS para permitir solicitudes desde los orígenes especificados
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // Permite solicitudes desde los orígenes permitidos
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(upload());
app.use("/uploads", express.static(__dirname + "/uploads"));


app.use('/api/stripe', stripeRoutes); // Ruta base para Stripe
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/users/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use(notFound);
app.use(errorHandler);

// Production script

connect(process.env.MONGO_URI)
 .then(
   app.listen(process.env.PORT, () => {
     console.log(`Server running on port ${process.env.PORT}`)
   })
 )
 .catch((error) => console.error(error));

//  connect(process.env.MONGO_URI)
//    .then(() => {

//      // Configuración del servidor HTTPS
//      const sslOptions = {
//        key: fs.readFileSync('/etc/ssl/certificate.key'), 
//        cert: fs.readFileSync('/etc/ssl/certificate.crt'), 
//        ca: fs.readFileSync('/etc/ssl/certificate.ca.crt')
//      };

// //     // Inicia el servidor HTTPS
//      https.createServer(sslOptions, app).listen(process.env.PORT, () => {
//        console.log(`HTTPS server running on port ${process.env.PORT}`);
//      });
//    })
//    .catch(error => console.error('MongoDB connection error:', error));

//   const servicesData = [
//     {
//       name: "Mensual",
//       description: "Suscripción mensual",
//       price: 20.99,
//       features: [
//         "Posibilidad de publicar anuncios",
//         "Acceso a la base de datos de animales",
//         "Notificaciones",
//         "Soporte prioritario",
//         "Un mes de prueba"
//       ],
//     },
//     {
//       name: "Anual",
//       description: "Suscripción anual",
//       price: 251.88,
//       discountPrice: 200,
//       features: [
//         "Posibilidad de publicar anuncios",
//         "Acceso a la base de datos de animales",
//         "Notificaciones",
//         "Soporte prioritario",
//         "Descuento del 10% en servicios adicionales",
//       ],
//     },
//     {
//       name: "Protectoras",
//       description: "Suscripción especial protectoras",
//       price: Consultar
//       features: [
//         "Posibilidad de publicar anuncios",
//         "Acceso a la base de datos de animales",
//         "Notificaciones",
//         "Soporte prioritario",
//         "Descuento del 30% en servicios adicionales",
//       ],
//     },
//   ];

// async function insertProducts(products) {
//   try {
//     // Insertar todos los productos en la base de datos de una vez
//     await Product.insertMany(products);
//     console.log('Productos insertados correctamente.');
//   } catch (error) {
//     console.error('Error al insertar productos:', error);
//   }
// }

// insertProducts(servicesData);

export { app };
