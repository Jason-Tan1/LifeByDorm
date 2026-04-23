import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  role?: string;
  googleId?: string;
  name?: string;
  picture?: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  googleId: {
    type: String,
    sparse: true
  },
  name: {
    type: String
  },
  picture: {
    type: String
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  }
});

const stripSensitiveFields = (_doc: any, ret: any) => {
  delete ret.password;
  delete ret.verificationCode;
  delete ret.verificationCodeExpires;
  delete ret.googleId;
  delete ret.__v;
  return ret;
};

userSchema.set('toJSON', { transform: stripSensitiveFields });
userSchema.set('toObject', { transform: stripSensitiveFields });

export const User = mongoose.model<IUser>('user', userSchema);
export const user = User;