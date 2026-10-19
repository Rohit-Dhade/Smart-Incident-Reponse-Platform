import mongoose, { type Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    name: string;
    email: string;
    passwordhash: string;
}

const UserSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordhash: {
        type: String,
        required: true,
        select: false
    },
}, { timestamps: true })

UserSchema.pre("save", async function () {
    if (!this.isModified("passwordhash")) {
        return;
    }
    this.passwordhash = await bcrypt.hash(this.passwordhash, 10)
})

export const UserModel = mongoose.model<IUser>("User", UserSchema);