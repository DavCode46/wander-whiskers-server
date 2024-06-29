import Post from "../models/Post.model.js";
import User from "../models/User.model.js";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import ErrorModel from "../models/Error.model.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* 
    CREATE A POST
    Post: api/posts
    PROTECTED ROUTE
*/

const createPost = async (req, res, next) => {
  try {
    let { title, content, specie, location, image, condition } = req.body;


    if (
      !title ||
      !content ||
      !specie ||
      !location ||
      !condition ||
      !image
    ) {
      return next(new ErrorModel("Todos los campos son obligatorios", 422));
    }
    const newPost = await Post.create({
      title,
      content,
      specie,
      location,
      condition,
      image,
      author: req.user.id,
    });
    if (!newPost) {
      return next(new ErrorModel("Error al crear la publicación", 422));
    }
    return res.status(201).json(newPost);
    // const { image } = req.files;
    /* Check the file size */
    // if (image.size > 2000000) {
    //   return next(new ErrorModel("La imagen debe tener un máximo de 2MB", 422));
    // }
    // let fileName = image.name;
    // let splittedFilename = fileName.split(".");
    // let newFilename =
    //   splittedFilename[0] +
    //   uuid() +
    //   "." +
    //   splittedFilename[splittedFilename.length - 1];
    // image.mv(
    //   path.join(__dirname, "..", "/uploads", newFilename),
    //   async (err) => {
    //     if (err) {
    //       return next(new ErrorModel(err));
    //     } else {
    //       const newPost = await Post.create({
    //         title,
    //         content,
    //         specie,
    //         location,
    //         condition,
    //         image: newFilename,
    //         author: req.user.id,
    //       });
    //       if (!newPost) {
    //         return next(new ErrorModel("Error al crear la publicación", 422));
    //       }
    //       return res.status(201).json(newPost);
    //     }
    //   }
    // );
  } catch (error) {
    return next(new ErrorModel(error));
  }
};

/* 
    Get all posts
    get: api/posts
    UNPROTECTED ROUTE
*/

const getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    return res.status(200).json(posts);
  } catch (err) {
    next(new ErrorModel(err));
  }
};

/* 
    Get a post
    get: api/posts/:id
    UNPROTECTED ROUTE
*/

const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return next(new ErrorModel("Post no encontrado", 404));
    return res.status(200).json(post);
  } catch (err) {
    next(new ErrorModel(err));
  }
};

/* 
    Get posts by location
    get: api/posts/location/:location
    unprotected route
*/

const getPostsByLocation = async (req, res, next) => {
  try {
    const { location } = req.params;
    const locationPosts = await Post.find({ location }).sort({ updatedAt: -1 });
    if (!locationPosts)
      return next(
        new ErrorModel("No se han encontrado posts en esta localización", 404)
      );
    return res.status(200).json(locationPosts);
  } catch (err) {
    next(new ErrorModel(err));
  }
};

/* 
    Get posts by pet type
    get: api/posts/specie/:specie
    unprotected route
*/

const getPostsBySpecie = async (req, res, next) => {
  try {
    const { specie } = req.params;

    const petPosts = await Post.find({ specie }).sort({ updatedAt: -1 });
    if (!petPosts)
      return next(
        new ErrorModel(
          "No se han encontrado posts de este tipo de mascota",
          404
        )
      );
    return res.status(200).json(petPosts);
  } catch (err) {
    next(new ErrorModel(err));
  }
};

/* 
    Get posts by condition
    get: api/posts/condition/:condition
    unprotected route
*/

const getPostsbyCondition = async (req, res, next) => {
  try {
    const { condition } = req.params;
    const conditionPosts = await Post.find({ condition }).sort({ updated: -1 });
    if (!conditionPosts)
      return next(ErrorModel("No se han encontrado posts ", 404));
    return res.status(200).json(conditionPosts);
  } catch (err) {
    next(new ErrorModel(err));
  }
};

/* 
    Get posts by author
    get: api/posts/users/:id
    unprotected route
*/

const getAuthorPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const author = await Post.find({ author: id }).sort({ updatedAt: -1 });
    if (!author)
      return next(
        new ErrorModel("No se han encontrado posts de este autor", 404)
      );
    return res.status(200).json(author);
  } catch (err) {
    next(new ErrorModel(err));
  }
};

/* 
    Update a post
    put: api/posts/:id
    PROTECTED ROUTE
*/

const updatePost = async (req, res, next) => {
  
  try {
    // let imageName;
    // let newImageName;
    let updatedPost;
    const postId = req.params.id;
    let { title, content, specie, image, condition, location } = req.body;
    if (!title || !content || !specie || !condition || !location)
      return next(new ErrorModel("Todos los campos son obligatorios", 422));
    if (image == null) {
     
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, content, specie, location, condition },
        { new: true }
      );
      if (!updatedPost)
        return next(new ErrorModel("Error al actualizar el post", 422));
      return res.status(200).json(updatedPost);
    } else {
      // const post = await Post.findById(postId);

      updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          title,
          content,
          specie,
          location,
          condition,
          image,
        },
        { new: true }
      );

      if (!updatedPost)
        return next(new ErrorModel("Error al actualizar el post", 422));
      return res.status(200).json(updatedPost);
      // if (image && req.user.id == post.author) {
      //   fs.unlink(
      //     path.join(__dirname, "..", "uploads", post.image),
      //     async (err) => {
      //       if (err) return next(new ErrorModel(err));
      //     }
      //   );

        // const { image } = req.files;
        // if (image.size > 2000000)
        //   return next(new ErrorModel("La imagen debe pesar menos de 2MB", 422));
        // imageName = image.name;
        // let splittedImageName = imageName.split(".");
        // newImageName =
        //   splittedImageName[0] +
        //   uuid() +
        //   "." +
        //   splittedImageName[splittedImageName.length - 1];
        // image.mv(
        //   path.join(__dirname, "..", "uploads", newImageName),
        //   async (err) => {
        //     if (err) return next(new ErrorModel(err));
        //     updatedPost = await Post.findByIdAndUpdate(
        //       postId,
        //       {
        //         title,
        //         content,
        //         specie,
        //         location,
        //         condition,
        //         image: newImageName,
        //       },
        //       { new: true }
        //     );

        //     if (!updatedPost)
        //       return next(new ErrorModel("Error al actualizar el post", 422));
        //     return res.status(200).json(updatedPost);
        //   }
        // );
      // }
    }
  } catch (err) {
    next(new ErrorModel(err));
  }
};

/* 
    Delete a post
    delete: api/posts/:id
    PROTECTED ROUTE
*/

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!postId) return next(new ErrorModel("Post no encontrado", 404));
    const post = await Post.findById(postId);
    const imageName = post?.image;
    const user = await User.findById(req.user.id);

    if (req.user.id != post.author && user.role != "admin")
      return next(
        new ErrorModel("No tienes permisos para eliminar este post", 403)
      );
    // if (imageName) {
    //   fs.unlink(
    //     path.join(__dirname, "..", "uploads", imageName),
    //     async (err) => {
    //       if (err) {
    //         return next(new ErrorModel(err));
    //       }
    //     }
    //   );
    // }

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({ msg: "Post eliminado" });
  } catch (err) {
    next(new ErrorModel(err));
  }
};

export {
  createPost,
  getAllPosts,
  getPost,
  getPostsByLocation,
  getPostsBySpecie,
  getPostsbyCondition,
  getAuthorPosts,
  updatePost,
  deletePost,
};
