// Gives an existing account the admin (site owner) role.
// Usage: npm run make-admin -- someone@example.com
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const User = require("../src/models/User");

async function main() {
  const email = (process.argv[2] || "").toLowerCase().trim();
  if (!email) {
    console.log("Usage: npm run make-admin -- someone@example.com");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
  if (user) {
    console.log(`@${user.nickname} (${user.email}) is now an admin. Log out and log in again to see admin buttons.`);
  } else {
    console.log(`No account found with email ${email}. Sign up on the site first.`);
  }
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
