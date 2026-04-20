/**
 * One-time script to create the first admin user.
 * Usage: node src/scripts/createAdmin.js
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import User from "../modules/auth/user.model.js";
import config from "../config/env.js";

await mongoose.connect(config.mongoUri);

const email = process.env.ADMIN_EMAIL || "admin@dijetindia.com";
const password = process.env.ADMIN_PASSWORD || "Admin@1234";
const name = process.env.ADMIN_NAME || "Admin";

const existing = await User.findOne({ email });
if (existing) {
  console.log(`Admin user already exists: ${email}`);
} else {
  await User.create({ name, email, password, role: "admin" });
  console.log(`✅ Admin user created: ${email} / ${password}`);
  console.log("Change the password after first login!");
}

await mongoose.disconnect();
