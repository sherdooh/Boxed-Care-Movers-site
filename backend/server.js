require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: [
      "https://boxedwithcare.co.ke",
      "https://www.boxedwithcare.co.ke",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is running on Vercel!" });
});

// Routes
app.use("/api/content", require("./routes/content"));
app.use("/api/leads", require("./routes/leads"));
app.use("/api/login", require("./routes/login"));
app.use("/api/me", require("./routes/me"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/google-reviews", require("./routes/googleReviews"));
app.use("/api/blogs", require("./routes/blogs"));
app.use("/sitemap.xml", require("./routes/sitemap"));
app.use("/api/ai", require("./routes/ai"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);

module.exports = app;
