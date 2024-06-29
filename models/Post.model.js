import { Schema, model } from "mongoose";
/* EMAIL TELÉFONO */
const postSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  specie: {
    type: String,
    required: true,
    enum: ["Perro", "Gato", "Otro"],
  },
  location: {
    type: String,
    required: true,
    
  },
  condition: {
    type: String,
    required: true,
    enum: ["Perdido", "Encontrado", "Adopción"]
  },
  // image: {
  //   type: String,
  //   required: true,
  // },
  image: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

export default model("Post", postSchema);
