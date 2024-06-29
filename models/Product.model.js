import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1},
  price: { type: Number },
  discountPrice: { type: Number },
  features: [{ type: String }],
}, { timestamps: true });

export default model("Product", ProductSchema);
