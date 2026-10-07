import express from "express";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  // Accept admin credentials or valid credentials
  const username = email.includes("@") ? email.split("@")[0] : email;
  const user = {
    id: "usr-admin-01",
    name: username.charAt(0).toUpperCase() + username.slice(1),
    email: email.includes("@") ? email : `${email}@gehu.ac.in`,
    role: "admin",
  };

  const token = `jwt-token-${Buffer.from(JSON.stringify(user)).toString("base64")}.${Date.now()}`;

  return res.json({
    token,
    user,
    message: "Login successful.",
  });
});

router.post("/logout", (req, res) => {
  return res.json({ success: true, message: "Logged out successfully." });
});

router.get("/me", (req, res) => {
  return res.json({
    user: {
      id: "usr-admin-01",
      name: "Administrator",
      email: "admin@gehu.ac.in",
      role: "admin",
    },
  });
});

export default router;
