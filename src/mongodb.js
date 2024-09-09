const mongoose = require("mongoose");

const bcrypt = require("bcrypt");



// Define Schema
const LoginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensure username is unique
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure email is unique
    },
    phone: {
        type: String,
        required: true, // Phone number is optional
        trim: true,
    },
    dateOfBirth: {
        type: Date,
        required: false, // Date of birth is optional
    },
    password: {
        type: String,
        required: true,
    },
    address:{
        type:String,
        required: false,
    },
}, { timestamps: true });

// Pre-save hook to hash the password before saving it
LoginSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Method to compare passwords
LoginSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Define Model
const Login = mongoose.model("Login", LoginSchema);
module.exports = Login;



