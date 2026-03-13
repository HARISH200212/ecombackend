const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        // Optional because Google Auth users won't have a password
    },
    avatar: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    provider: {
        type: String,
        default: 'local'
    },
    googleId: {
        type: String
    },
    facebookId: {
        type: String
    },
    twitterId: {
        type: String
    },
    phone: {
        type: String
    },
    projectName: {
        type: String
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

module.exports = mongoose.model('User', userSchema);
