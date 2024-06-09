const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const admin_secret_key = "admin_s3cR3T";
const user_secret_key = "user_S3Cret";

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		lowercase: true,
	},
	password: {
		type: String,
		required: true,
	},
	purchasedCourses: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Course",
		},
	],
});

const adminSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
});

const courseSchema = new mongoose.Schema({
	title: String,
	description: String,
	price: Number,
	imageLink: String,
	published: Boolean,
});

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Course = mongoose.model("Course", courseSchema);

const authenticateUser = (req, res, next) => {
	const userAuthenticationHeader = req.headers.authorization;
	if (userAuthenticationHeader) {
		const token = userAuthenticationHeader.split(" ")[1];
		jwt.verify(token, user_secret_key, (err, user) => {
			if (err) {
				return res.sendStatus(403);
			}
			req.user = user;
			next();
		});
	} else {
		res.sendStatus(401);
	}
};

const authenticateAdmin = (req, res, next) => {
	const adminAuthenticationHeader = req.headers.authorization;
	if (adminAuthenticationHeader) {
		const token = adminAuthenticationHeader.split(" ")[1];
		jwt.verify(token, admin_secret_key, (err, admin) => {
			if (err) {
				return res.sendStatus(403);
			}
			req.admin = admin;
			next();
		});
	} else {
		res.sendStatus(401);
	}
};

mongoose.connect(
	"mongodb+srv://japsimarsoin2003:zV9bbnpRPGomDrFc@cluster0.lmwntbi.mongodb.net/"
);

// Admin routes
app.post("/admin/signup", async (req, res) => {
	// logic to sign up admin
	const admin = req.body;
	const adminExists = await Admin.findOne({ username: admin.username });
	if (adminExists) {
		res.status(403).json({ message: "Admin exists already" });
	} else {
		const newAdmin = new Admin({
			username: admin.username,
			password: admin.password,
		});
		newAdmin.save();
		const token = jwt.sign(
			{ username: admin.username, role: "admin" },
			admin_secret_key,
			{ expiresIn: "1h" }
		);
		res.json({ message: "Admin created successfully", token });
	}
});

app.post("/admin/login", async (req, res) => {
	// logic to log in admin
	const admin = req.headers;
	const adminExists = await Admin.findOne({
		username: admin.username,
		password: admin.password,
	});
	if (adminExists) {
		const token = jwt.sign(
			{ username: admin.username, role: "admin" },
			admin_secret_key,
			{ expiresIn: "1h" }
		);
		res.json({ message: "Admin logged in successfully", token });
	} else {
		res.status(403).json({ message: "Invalid credentials" });
	}
});

app.post("/admin/courses", authenticateAdmin, async (req, res) => {
	// logic to create a course
	const course = new Course(req.body);
	await course.save();
	res.json({ message: "Course created successfully", courseId: course.id });
});

app.put("/admin/courses/:courseId", authenticateAdmin, async (req, res) => {
	// logic to edit a course
	const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
		new: true,
	});
	if (course) {
		res.json({ message: "Course updated successfully" });
	} else {
		res.status(404).json({ message: "Course not found" });
	}
});

app.get("/admin/courses", authenticateAdmin, async (req, res) => {
	// logic to get all courses
	const courses = await Course.find({});
	res.json({ courses: courses });
});

// User routes
app.post("/users/signup", async (req, res) => {
	// logic to sign up user
	const user = req.body;
	const userExists = User.findOne({ username: user.username });
	if (userExists) {
		const token = jwt.sign(
			{ username: user.username, role: "user" },
			user_secret_key,
			{ expiresIn: "1h" }
		);
		res.json({ message: "Username already exists" });
	} else {
		const newUser = new User({
			username: user.username,
			password: user.password,
		});
		await newUser.save();
		const token = jwt.sign(
			{ username: user.username, role: "user" },
			user_secret_key,
			{ expiresIn: "1h" }
		);
		res.json({ message: "User created successfully", token });
	}
});

app.post("/users/login", async (req, res) => {
	// logic to log in user
	const user = req.headers;
	const userExists = await User.findOne({
		username: user.username,
		password: user.password,
	});
	if (userExists) {
		const token = jwt.sign(
			{ username: user.username, role: "user" },
			user_secret_key,
			{ expiresIn: "1h" }
		);
		res.json({ message: "User logged in successfully", token });
	} else {
		res.status(403).json({ message: "User doesn't exist" });
	}
});

app.get("/users/courses", authenticateUser, async (req, res) => {
	// logic to list all courses
	const courses = await Course.find({ published: true });
	res.json({ courses: courses });
});

app.post("/users/courses/:courseId", authenticateUser, async (req, res) => {
	// logic to purchase a course
	const course = await Course.findById(req.params.courseId);
	if (course) {
		const user = User.findOne({ username: req.user.username });
		if (user) {
			user.purchasedCourses.push(course);
			await user.save();
			res.json({ message: "Course purchased" });
		} else {
			res.status(403).json({ message: "User not found" });
		}
	} else {
		res.status(404).json({ message: "Course not found" });
	}
});

app.get("/users/purchasedCourses", authenticateUser, async (req, res) => {
	// logic to view purchased courses
	const user = await User.findOne({ username: req.user.username }).populate(
		"purchasedCourses"
	);
	if (user) {
		res.json({ purchasedCourses: user.purchasedCourses || [] });
	} else {
		res.status(403).json({ message: "User not found" });
	}
});

app.listen(3000, () => {
	console.log("Server is listening on port 3000");
});
