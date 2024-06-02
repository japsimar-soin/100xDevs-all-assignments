// const express = require('express');
// const bodyParser = require('body-parser');

// const app = express();

// const port = process.env.PORT || 3000;

// app.use(express.json());

// app.post("/admin/signup");

// app.listen(port, () => {
// 	console.log(`Server is listening on port ${port}`);
// });

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(express.json());

let admins = [];
let users = [];
let courses = [];

const adminAuthentication = (req, res, next) => {
	const admin = req.headers;
	const adminExists = admins.find(
		(a) => a.username === admin.username && a.password === admin.password
	);
	if (adminExists) {
		next();
	} else {
		res.status(403).json({ message: "Admin authentication failed" });
	}
};

const userAuthentication = (req, res, next) => {
	const user = req.headers;
	const userExists = users.find(
		(u) => u.username === user.username && u.password === user.password
	);
	if (userExists) {
		req.user = userExists; //sends user object as a property of the request, would be used in fetching the details of individual users to get their purchased courses
		next();
	} else {
		res.json({ message: "User authentication failed" });
	}
};

app.post("/admin/signup", (req, res) => {
	const admin = req.body;
	// const admin = {
	//     username: req.body.username,
	//     password: req.body.password
	// };
	const adminExists = admins.find((a) => a.username === admin.username);
	if (adminExists) {
		res.status(403).json({ message: "Admin already exists" });
	} else {
		admins.push(admin);
		res.json({ message: "Admin created successfully" });
	}
});

app.post("/admin/login", adminAuthentication, (req, res) => {
	res.json({ message: "Admin logged in successfully" });
});

app.post("/admin/courses", adminAuthentication, (req, res) => {
	const courseId = Math.floor(Math.random() * 10000);
	const course = { ...req.body, id: courseId };
	course.id = courseId;
	courses.push(course);
	res.json({ message: "Course uploaded successfully", courseId: courseId });
});

app.put("/admin/courses/:courseId", adminAuthentication, (req, res) => {
	const courseId = parseInt(req.params.courseId);
	const newCourse = req.body;
	const course = courses.find((c) => c.id === courseId);
	if (course) {
		Object.assign(course, newCourse);
		res.json({ message: "Course updated successfully" });
	} else {
		res.status(404).json({ message: "Course not found" });
	}
});

app.get("/admin/courses", adminAuthentication, (req, res) => {
	res.json({ courses: courses });
});

app.post("/users/signup", (req, res) => {
	const user = { ...req.body, purchasedCourses: [] };
	const userExists = users.find((u) => u.username === user.username);
	if (userExists) {
		res.status(403).json({ message: "User exists already" });
	} else {
		users.push(user);
		res.json({ mesage: "User created successfully" });
	}
});

app.post("/users/login", userAuthentication, (req, res) => {
	res.json({ message: "User logged in successfully" });
});

app.post("/users/courses/:courseId", userAuthentication, (req, res) => {
	const courseId = parseInt(req.params.courseId);
	const course = courses.find((c) => c.id === courseId && c.published);
	if (course) {
		req.user.purchasedCourses.push(courseId);
		res.json({ message: "Course purchased successfully" });
	} else {
		res.status(404).json({ message: "Course not found" });
	}
});

app.get("/users/courses", userAuthentication, (req, res) => {
	res.json({ courses: courses.filter((c) => c.published) });
});

app.get("/users/purchasedCourses", userAuthentication, (req, res) => {
	const purchasedCourses = courses.filter((c) =>
		req.user.purchasedCourses.includes(c.id)
	);
	res.json({ purchasedCourses: purchasedCourses });
});

app.listen(3000, () => {
	console.log("Server is listening at port 3000");
});
