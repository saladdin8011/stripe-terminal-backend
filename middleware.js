const express = require("express");  // Ensure Express is imported
const helmet = require("helmet"); // Security headers
const cors = require("cors"); // Cross-origin protection
const morgan = require("morgan"); // Logging
const compression = require("compression"); // Performance boost

module.exports = (app) => {
  app.use(helmet()); // Add security headers
  app.use(cors()); // Allow API access
  app.use(morgan("tiny")); // Log requests
  app.use(compression()); // Improve performance
  app.use(express.json()); // Parse JSON requests
};
