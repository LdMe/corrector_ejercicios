import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: String,
    email:{
        type: String,
        unique: true,
        required: true
    },
    password: String,
    role: {
        type: String,
        enum: ['admin', 'student', 'teacher'],
        default: 'student'
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: false,
        default: []
    }],
    completed: {
        exercises: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise',
            required: false,
            default: []
        }],
        subjects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: false,
            default: []
        }],
        courses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: false,
            default: []
        }]
    }
});


userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
}

// Hash the plain text password before saving

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
    next();
});

const User = mongoose.model('User', userSchema);

export default User;