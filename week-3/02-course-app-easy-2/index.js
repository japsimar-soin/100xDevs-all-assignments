require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

const port = 4000;

let ADMINS = [];
let USERS = [];
let COURSES = [];

const secretKey = "s3cReT_k3y";

const generateToken = (user) => {
	const payload = { username: user.username };
	return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};

//because this is a middleware: isliye (req, res, next)
const authenticateUser = (req, res, next) => {
	const authenticationHeader = req.headers.authorization; //headers mein authorization wali field contians a string of the form: 'Bearer 38wc4b3ov687yurc3pcv3cevti'
	if (authenticationHeader) {
		const token = authenticationHeader.spilt(" ")[1]; //gives just the token gibberish, from string: 'Bearer jwt_token_gibberish'
		jwt.verify(token, secretKey, (err, user) => {
			if (err) {
				res.status(403).json({ message: "Error encountered" });
			} else {
				req.user = user;
				next();
			}
		});
	} else {
		res.status(401).json("Authentication failed");
	}
};

// Admin routes
app.post("/admin/signup", (req, res) => {
	// logic to sign up admin
	const admin = req.body;
	const adminExists = ADMINS.find((a) => a.username === admin.username);
	if (adminExists) {
		res.status(403).json("Admin exists already");
	} else {
		ADMINS.push(admin);
		const token = generateToken(admin);
		res.json({ message: "Admin created successfully", token });
	}
});

app.post("/admin/login", (req, res) => {
	// logic to log in admin
	const admin = req.headers;
	const adminExists = ADMINS.find(
		(a) => a.username === admin.username && a.password === admin.password
	);
	if (adminExists) {
		const token = generateToken(admin); //this is generated only to be returned to the user at login, and is not needed for authentication, it has already been handled above by matching the credentials
		res.json({ message: "Admin logged in successfully", token });
	} else {
		res.status(403).json({ message: "Admin authentication failed" });
	}
});

app.post("/admin/courses", authenticateUser, (req, res) => {
	// logic to create a course
	const course = req.body;
	course.id = Date.now();
	COURSES.push(course);
	res.json({ message: "Course created successfully", courseId: course.id });
});

app.put("/admin/courses/:courseId", authenticateUser, (req, res) => {
	// logic to edit a course
	const courseId = parseInt(req.params.courseId);
	const courseIdx = COURSES.findIndex((c) => c.id === courseId);
	if (courseIdx > -1) {
		const updatedCourse = { ...COURSES[courseIdx], ...req.body }; //baad wala spread operator takes precedence for any overlapping properties
		COURSES[courseIdx] = updatedCourse;
		res.json({ message: "Course updated successfully" });
	} else {
		res.status(404).json({ message: "Course not found" });
	}
});

app.get("/admin/courses", authenticateUser, (req, res) => {
	// logic to get all courses
	res.json({ courses: COURSES });
});

// User routes
app.post("/users/signup", (req, res) => {
	// logic to sign up user
	const user = req.body;
	const userExists = USERS.find((u) => u.username === user.username);
	if (userExists) {
		res.status(403).json({ message: "User already exists" });
	} else {
		USERS.push(user);
		const token = generateToken(user);
		res.json({ message: "User created successfully", token });
	}
});

app.post("/users/login", (req, res) => {
	// logic to log in user
	const user = req.headers;
	const userExists = USERS.find(
		(u) => u.username === user.username && u.password === user.password
	);
	if (userExists) {
		const token = generateToken(user);
		res.json({ message: "User logged in successfully", token });
	} else {
		res.status(403).json("Wrong credentials");
	}
});

app.get("/users/courses", authenticateUser, (req, res) => {
	// logic to list all courses
  res.json({ courses: COURSES });
});

app.post("/users/courses/:courseId", authenticateUser, (req, res) => {
	// logic to purchase a course
  const courseIdx = parseInt(req.params.courseId);
  const courseExists = COURSES.find((c) => c.id === courseId);
  if(courseExists){
    const user = USERS.find((u) => u.username === req.user.username);
    if(user){
      if(!user.purchasedCourses){
        user.purchasedCourses = [];
      }
      user.purchasedCourses.push(courseExists);
      res.json({message: "Course added successfully"});
    }
    else{
      res.status(403).json({message: "User not found"});
    }
  }
  else{
    res.status(404).json({ message: "Course not found" });
  }
});

app.get("/users/purchasedCourses", authenticateUser, (req, res) => {
	// logic to view purchased courses
  const user = req.headers;
	const userExists = USERS.find(
		(u) => u.username === user.username && u.password === user.password
	);
	if (userExists) {
    if(user.purchasedCourses){
      res.json({purchasedCourses: user.purchasedCourses})
    }
    else{
      res.status(404).json({message: "No courses purchased"});
    }
  }
  else{
    res.status(403).json({message: "User does not exist"});
  }
});

app.listen(port, () => {
	console.log(`Server is listening on ${port}`);
});
