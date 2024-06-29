import { model, Schema } from "mongoose";

const CartSchema = new Schema({
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  }
}, { timestamps: true });

export default model("Cart", CartSchema);
