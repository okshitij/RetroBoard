import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';


const userSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

const userModel = mongoose.model<IUser>('User', userSchema);

export default userModel;