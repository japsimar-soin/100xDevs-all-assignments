const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

let admins = [];
let users = [];
let courses = [];

const user_secret_key = "userSECRET";
const admin_secret_key = "adminSECRET";

const generateAdminToken = (admin) => {
	const payload = { username: admin.username };
	const token = jwt.sign(payload, admin_secret_key, { expiresIn: "1h" });
	return token;
};

const generateUserToken = (user) => {
	const payload = { username: user.username };
	const token = jwt.sign(payload, user_secret_key, { expiresIn: "1h" });
	return token;
};

const authenticateAdmin = (req, res, next) => {
	const authorizationHeader = req.headers.authorization;
	if (authorizationHeader) {
		//agar token headers mein bheja hai toh
		const token = authorizationHeader.split(" ")[1];
		jwt.verify(token, admin_secret_key, (err, admin) => {
			if (err) {
				return res.sendStatus(403);
			}
			req.admin = admin;
			next();
		});
	} else {
		res.status(403).json({ message: "Admin not authorized" });
	}
};

const authenticateUser = (req, res, next) => {
	const authorizationHeader = req.headers.authorization;
	if (authorizationHeader) {
		const token = authorizationHeader.pslit(" ")[1];
		jwt.verify(token, user_secret_key, (err, user) => {
			if (err) {
				return res.sendStatus(403);
			}
			req.user = user;
			next();
		});
	} else {
		res.status(403).json({ message: "User not authorized" });
	}
};

app.post("/admin/signup", (req, res) => {
	const admin = req.body;
	const adminExists = admins.find((a) => a.username === admin.username);
	if (adminExists) {
		res.status(403).json({ message: "Username already taken" });
	} else {
		admins.push(admin);
		const token = generateAdminToken(admin);
		res.json({ message: "Admin created successfully", token });
	}
});

app.post("/admin/login", (req, res) => {
	const admin = req.headers;
	const adminExists = admins.find(
		(a) => a.username === admin.username && a.password === admin.password
	);
	if (adminExists) {
		const token = generateAdminToken(admin);
		res.json({ message: "Admin logged in successfully" }, token);
	} else {
		res.status(403).json({ message: "Wrong credentials" });
	}
});

app.post("/admin/courses", authenticateAdmin, (req, res) => {
	const course = req.body;
	course.id = Date.now();
	courses.push(course);
	res.json({ message: "Course added successfully" });
});

app.put("/admin/courses/:courseId", authenticateAdmin, (req, res) => {
	const courseId = parseInt(req.params.courseId);
	const courseIdx = courses.find((c) => c.id === courseId);
	if (courseIdx === -1) {
		res.status(404).json({ message: "Course not found" });
	} else {
		const updatedCourse = { ...courses[courseIdx], ...req.body };
		courses[courseIdx] = updatedCourse;
		res.json({ message: "Course updated successfully" });
	}
});

app.get("/admin/courses", authenticateAdmin, (req, res) => {
	res.json({ courses: courses });
});

app.post("/users/signup", (req, res) => {
	const user = req.body;
	const userExists = users.find((u) => u.username === user.username);
	if (userExists) {
		res.status(403).json({ message: "Username already taken" });
	} else {
		users.push(user);
		const token = generateUserToken(user);
		res.json({ message: "User created successfully", token });
	}
});

app.post("/users/login", (req, res) => {
	const user = req.headers;
	const userExists = users.find((u) => u.username === user.username);
	if (userExists) {
		const token = generateUserToken(user);
		res.json({ message: "User logged in successfully" }, token);
	} else {
		res.status(403).json({ message: "User does not exist" });
	}
});

app.get("/users/courses", authenticateUser, (req, res) => {
	res.json({ courses: courses.filter((c) => c.published) });
});

app.post("/users/courses/:courseId", authenticateUser, (req, res) => {
	const courseId = parseInt(req.params.courseId);
	const course = courses.find((c) => c.id === courseId && c.published);
	if (course) {
		if (!req.user.purchasedCourses) {
			req.user.purchasedCourses = [];
		}
		req.user.purchasedCourses.push(courseId);
		res.json({ message: "Course purchased successfully" });
	} else {
		res.status(404).json({ message: "Course not found" });
	}
});

app.get("/users/purchasedCourses", authenticateUser, (req, res) => {
	const purchasedCourses = courses.filter((c) =>
		req.user.purchasedCourses.includes(c.id)
	);
	res.json({ purchasedCourses: purchasedCourses });
});

app.listen(port, () => {
	console.log(`Server is listening at port ${port}`);
});
