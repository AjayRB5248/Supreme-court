const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const courtRoutes = require("./routes/courtRoutes");
const cors = require("cors");
require("dotenv").config();
const mongoURI = process.env.MONGO_URL;

const app = express();
const port = process.env.PORT || 3000;

// Trust the first proxy if behind a reverse proxy
app.set("trust proxy", 1);

// Apply Helmet for security
app.use(helmet());

// Use Morgan for logging
app.use(morgan("combined"));

//for cors
app.use(cors());

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use("/api", limiter); // Apply rate limiting to API routes

// MongoDB Connection
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

app.use("/api/v1", courtRoutes);

app.get("/", (req, res) => {
  res.send("Server Started");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
