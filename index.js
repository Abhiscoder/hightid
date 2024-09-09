const express = require("express");
const path = require("path");
const ejs = require("ejs");
const mongoose = require("mongoose");
const Login = require("./src/mongodb");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const multer = require('multer');  // Add multer for file uploads
const fs = require('fs');
const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Create a unique filename
    }
});

const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Beach")
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch(err => {
        console.error("Failed to connect", err);
    });
    async function main() {
        await mongoose.connect(MONGO_URL);
    }


app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle file upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send('File uploaded successfully: ' + req.file.filename);
});

app.get("/", (req, res) => {
    res.render("SIH");
});


app.get("/", (req, res) => {
    res.render("show");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});
app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/reset", (req, res) => {
    res.render("reset");
});

app.post("/signup", async (req, res) => {
    try {
        const { username, password, confirmpassword, email, phone, dob, add } = req.body;

        // Log received data
        console.log("Received data:", { username, password, confirmpassword, email, phone, dob, add });

        // Validate that all required fields are provided
        if (!username || !password || !confirmpassword || !email) {
            return res.status(400).send("Username, email, and password are required.");
        }

        // Check that password and confirmPassword match
        if (password !== confirmpassword) {
            return res.status(400).send("Passwords do not match.");
        }

        // Validate password criteria
        const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-zA-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send("Password must be at least 8 characters long, contain at least one special character, and one digit.");
        }

        // Create a new user using the Mongoose model's `create` method
        const newUser = await Login.create({
            username,
            email,
            phone,
            dob,
            add,
            password // Note: Hash the password before saving to the database
        });
        console.log("User created:", newUser);

        // Render home page after successful signup
        res.render("SIH");
    } catch (err) {
        console.error("Error during signup:", err);
        // Handle different types of errors
        if (err.name === "ValidationError") {
            return res.status(400).send("Validation error: " + err.message);
        }
        // Handle unique constraint errors
        if (err.code === 11000) {
            return res.status(400).send("Username or email already exists.");
        }
        res.status(500).send("Error signing up");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Log received data
        console.log("Login attempt:", { username, password });

        // Find the user by username
        const user = await Login.findOne({ username });

        if (user) {
            // Compare the provided password with the hashed password in the database
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (isMatch) {
                // Passwords match, login successful
                res.render("SIH");
            } else {
                // Passwords do not match
                res.status(400).send("Wrong password");
            }
        } else {
            // User not found
            res.status(400).send("Username not found");
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("Error logging in");
    }
});

app.listen(8000, () => {
    console.log("Server running on port 8000");
});
