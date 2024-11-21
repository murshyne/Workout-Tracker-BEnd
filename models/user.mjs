import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String }, 
    
    // tracks when the user was created
    date: { type: Date, default: Date.now }, 
});

const User = mongoose.model('User', UserSchema);

export default User;
