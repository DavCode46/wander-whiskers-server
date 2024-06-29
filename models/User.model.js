import { Schema, model } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    profileImage: {
        type: String
    },
    isSubscribed: {
        type: Boolean,
        default: false
    },
    resetToken: {type: String},
    cart: [{
        type: Schema.Types.ObjectId,
        ref: "Cart"
    }]
    /* POSTS */
}, { timestamps: true });

export default model("User", userSchema);