import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import ErrorModel from "../models/Error.model.js";
import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import Cart from "../models/Cart.model.js";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});
/* 
    REGISTER A USER
    post --> api/users/register

    UNPROTECTED ROUTE
*/

const register = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    if (!username || !email || !password)
      return next(new ErrorModel("Por favor, rellene todos los campos", 400));

    const lowerEmail = email.toLowerCase();

    const emailInUse = await User.findOne({ email: lowerEmail });

    if (emailInUse)
      return next(new ErrorModel("El correo electrónico ya está en uso", 400));

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordPattern.test(password.trim()))
      return next(
        new ErrorModel(
          `La contraseña debe constar al menos de 8 caracteres de longitud, una letra mayúscula, una letra minúscula y un carácter especial
          `,
          400
        )
      );
    if (password !== confirmPassword)
      return next(new ErrorModel("Las contraseñas no coinciden", 400));

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const admin = await User.findOne({ role: "admin" });

    if (!admin && email == process.env.ADMIN_EMAIL) {
      const user = new User({
        username,
        email: lowerEmail,
        password: hashedPassword,
        role: "admin",
      });
      await user.save();
      return res.status(201).json(`Usuario ${user.email} registrado con éxito`);
    } else {
      const user = new User({
        username,
        email: lowerEmail,
        password: hashedPassword,
      });
      await user.save();
      transporter.sendMail({
        from: "davidblanco1993@gmail.com",
        to: email,
        subject: "¡Registro Wander Whiskers!",
        html: `<!DOCTYPE html>
        <html lang="es">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Registro exitoso!</title>
        <style>
        /* Estilos generales */
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #1890ff;
            text-align: center;
        }
        p {
            color: #555;
            text-align: center;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background-color: #1890ff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #1473e6;
        }
        </style>
        </head>
        <body>
            <div class="container">
                <h1>¡Registro exitoso!</h1>
                <p>Gracias por registrarte. Te has registrado exitosamente en Wander Whiskers.</p>
                <p>Por favor, haz clic en el botón a continuación para iniciar sesión:</p>
                <div style="text-align: center;">
                    <a class="button" style="color: white;" href=${process.env.CLIENT_URL}>Iniciar sesión</a>
                </div>
            </div>
        </body>
        </html>
        `,
      });
      return res.status(201).json(`Usuario ${user.email} registrado con éxito`);
    }
  } catch (err) {
    return next(new ErrorModel("Registro fallido", 422));
  }
};

/* 
    LOGIN A USER
    post --> api/users/login

    UNPROTECTED ROUTE
*/

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new ErrorModel("Por favor, rellene todos los campos", 400));

    const lowerEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerEmail });
    if (!user) return next(new ErrorModel("Credenciales incorrectas", 400));

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword)
      return next(new ErrorModel("Credenciales incorrectas", 400));

    const { _id: id, username } = user;

    const token = jwt.sign({ id, username }, process.env.SECRET_TOKEN, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      token,
      id,
      username,
      role: user.role,
      isSubscribed: user.isSubscribed,
    });
  } catch (err) {
    return next(new ErrorModel("Inicio de sesión fallido", 422));
  }
};

/* 
    ROUTE FOR THE USER PROFILE
    get --> api/users/:id

    PROTECTED ROUTE
*/

const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) return next(new ErrorModel("Usuario no encontrado", 404));

    return res.status(200).json(user);
  } catch (err) {
    return next(new ErrorModel("Error al obtener el perfil del usuario", 422));
  }
};

/* 
    GET USERS
    GET: api/users/creators
    UNPROTECTED ROUTE    
*/

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    if (!users) return next(new ErrorModel("No se encontraron usuarios", 404));

    return res.status(200).json(users);
  } catch (err) {
    return next(new ErrorModel("Error al obtener los usuarios", 422));
  }
};

/* 
    CHANGE USER PROFILE IMAGE
    POST: api/users/change-image
    PROTECTED ROUTE
*/

const changeImage = async (req, res, next) => {
  try {
    // if (!req.files.profileImage) {
    //   return next(new ErrorModel("Por favor selecciona una imagen", 422));
    // }

    const user = await User.findById(req.user.id);

    // if (user.profileImage) {
    //   fs.unlink(
    //     path.join(__dirname, "..", "uploads", user.profileImage),
    //     (err) => {
    //       if (err) {
    //         console.error("Error deleting old profile image:", err);
    //       }
    //     }
    //   );
    // }

    const { profileImage } = req.body;

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { profileImage },
        { new: true }
      );

      if (!updatedUser) {
        return next(
          new ErrorModel("Error al cambiar la imagen de perfil", 422)
        );
      }

      return res.status(200).json(updatedUser);
    } catch (updateError) {
      return next(new ErrorModel(updateError, 500));
    }

    // if (profileImage.size > 2000000) {
    //   return next(
    //     new ErrorModel("La imagen de perfil no puede superar los 2Mb", 422)
    //   );
    // }

    // const fileName = profileImage.name;
    // const splittedFilename = fileName.split(".");
    // const newFilename =
    //   splittedFilename[0] +
    //   uuid() +
    //   "." +
    //   splittedFilename[splittedFilename.length - 1];

    // profileImage.mv(
    //   path.join(__dirname, "..", "uploads", newFilename),
    //   async (err) => {
    //     if (err) {
    //       return next(new ErrorModel(err, 500));
    //     }

    //     try {
    //       const updatedUser = await User.findByIdAndUpdate(
    //         req.user.id,
    //         { profileImage: newFilename },
    //         { new: true }
    //       );

    //       if (!updatedUser) {
    //         return next(
    //           new ErrorModel("Error al cambiar la imagen de perfil", 422)
    //         );
    //       }

    //       return res.status(200).json(updatedUser);
    //     } catch (updateError) {
    //       return next(new ErrorModel(updateError, 500));
    //     }
    //   }
    // );
  } catch (error) {
    return next(new ErrorModel(error, 500));
  }
};
/* 
    EDIT USER PROFILE
    POST: api/users/edit
    PROTECTED ROUTE
*/

const editUser = async (req, res, next) => {
  try {
    const {
      username,
      email,
      currentPassword,
      newPassword,
      confirmNewPassword,
    } = req.body;

    if (!username || !email || !currentPassword || !newPassword)
      return next(new ErrorModel("Por favor, rellene todos los campos", 400));

    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorModel("Usuario no encontrado", 404));

    const emailInUse = await User.findOne({ email });
    if (emailInUse && emailInUse._id != user.id)
      return next(new ErrorModel("El correo electrónico ya está en uso", 400));

    const validatePassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!validatePassword)
      return next(new ErrorModel("Credenciales incorrectas", 400));

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    )

    if(samePassword)
      return next(new ErrorModel("La nueva contraseña no puede ser igual a la anterior", 400));

    if (newPassword !== confirmNewPassword)
      return next(new ErrorModel("Las contraseñas no coinciden", 400));

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const newUserInformation = await User.findByIdAndUpdate(
      req.user.id,
      {
        username,
        email,
        password: hashedPassword,
      },
      { new: true }
    );

    return res.status(200).json(newUserInformation);
  } catch (err) {
    return next(new ErrorModel("Error al editar el perfil del usuario", 422));
  }
};

/* 
    Delete a user
    delete: api/users/:id
    PROTECTED ROUTE
*/

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return next(new ErrorModel("Usuario no encontrado", 404));
    }

    // Verificar permisos: el usuario actual debe ser el propietario del usuario a eliminar o un administrador
    if (req.user.id !== userToDelete.id && req.user.username !== "admin") {
      return next(
        new ErrorModel("No tienes permisos para eliminar este usuario", 403)
      );
    }

    // Encontrar y eliminar todos los posts del usuario
    const posts = await Post.find({ author: userId });

    // Eliminar imágenes de los posts en paralelo
    const deletePostImagesPromises = posts.map(async (post) => {
      if (post.image) {
        const imagePath = path.join(__dirname, "..", "uploads", post.image);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(err); // Log the error instead of sending it directly
          }
        });
      }
    });
    await Promise.all(deletePostImagesPromises);

    // Eliminar todos los posts del usuario
    await Post.deleteMany({ author: userId });

    // Eliminar el carrito del usuario si existe
    await Cart.findOneAndDelete({ user: userId });

    // Eliminar la imagen de perfil asociada si existe
    if (userToDelete.profileImage) {
      const profileImagePath = path.join(
        __dirname,
        "..",
        "uploads",
        userToDelete.profileImage
      );
      fs.unlink(profileImagePath, (err) => {
        if (err) {
          console.error(err); // Log the error instead of sending it directly
        }
      });
    }

    // Eliminar el usuario de la base de datos
    await User.findByIdAndDelete(userId);

    return res.status(200).json({ msg: "Usuario eliminado" });
  } catch (err) {
    next(new ErrorModel(err));
  }
};

const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const lowerEmail = email.toLowerCase();
  try {
    if (!email) {
      return next(new ErrorModel("Correo electrónico no proporcionado"));
    }

    // Validar si el correo electrónico es válido usando una expresión regular
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ErrorModel("Correo electrónico incorrecto"));
    }

    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return next(new ErrorModel("Usuario no encontrado"));
    }

    const secret = process.env.SECRET_TOKEN + user.password;

    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "1h",
    });

    const link = `${process.env.APP_RESET_PASSWORD_URL}/reset-password/${user._id}/${token}`;
    // Send the reset token to the user's email
    transporter.sendMail({
      from: "davidblanco1993@gmail.com",
      to: email,
      subject: "Recuperar contraseña Wander Whiskers!",
      html: `<!DOCTYPE html>
      <html lang="es">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar contraseña</title>
      <style>
      /* Estilos generales */
      body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
      }
      .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1 {
          color: #1890ff;
          text-align: center;
      }
      p {
          color: #555;
          text-align: center;
          margin-bottom: 20px;
      }
      .button {
          display: inline-block;
          background-color: #1890ff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          text-align: center;
          transition: background-color 0.3s ease;
      }
      .button:hover {
          background-color: #1473e6;
      }
      </style>
      </head>
      <body>
        <div class="container">
          <h1>¡Recuperación de contraseña!</h1>
          <p>Hemos recibido una solicitud para restablecer tu contraseña en Wander Whiskers.</p>
          <p>Por favor, haz clic en el botón a continuación para restablecer tu contraseña:</p>
          <div style="text-align: center;">
            <a class="button" style="color: white;" href=${link}>Restablecer Contraseña</a>
          </div>
        </div>
      </body>
      </html>
      `,
    });
    return res
      .status(200)
      .json({ message: "Correo de recuperación enviado exitosamente" });
  } catch (err) {
    return next(new ErrorModel(err));
  }
};

const resetPassword = async (req, res, next) => {
  const { id, token } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return next(new ErrorModel("Usuario no encontrado", 404));
    }

    const secret = process.env.SECRET_TOKEN + user.password;

    try {
      // Verificar el token y asegurarse de que sea válido y correspondiente al usuario
      const decoded = jwt.verify(token, secret);

      if (decoded.id == user._id) {
        const { newPassword, confirmNewPassword } = req.body;

        if (!newPassword || !confirmNewPassword) {
          return next(
            new ErrorModel("Por favor, rellene todos los campos", 400)
          );
        }

        if (newPassword !== confirmNewPassword) {
          return next(new ErrorModel("Las contraseñas no coinciden", 400));
        }

        const passwordPattern =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(newPassword.trim())) {
          return next(
            new ErrorModel(
              `<ul>
                    <li>Al menos 8 caracteres de longitud</li>
                    <li>Al menos una letra mayúscula</li>
                    <li>Al menos una letra minúscula</li>
                    <li>Al menos un caracter especial</li>
              </ul>`,
              400
            )
          );
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updatedUser = await User.findByIdAndUpdate(
          { _id: id },
          { password: hashedPassword },
          { new: true }
        );

        return res.status(200).json(updatedUser);
      }
    } catch (err) {
      return next(new ErrorModel(err));
    }
  } catch (err) {
    return next(new ErrorModel(err));
  }
};

export {
  register,
  login,
  getUser,
  getUsers,
  changeImage,
  editUser,
  deleteUser,
  forgetPassword,
  resetPassword,
};
