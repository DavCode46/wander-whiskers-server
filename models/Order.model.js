import { model, Schema } from "mongoose";

const OrderSchema = new Schema({
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

export default model("Order", OrderSchema);
