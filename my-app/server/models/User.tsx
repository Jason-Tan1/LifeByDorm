import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role?: string;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
  ,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

export const User = mongoose.model<IUser>('user', userSchema);
export const user = User;