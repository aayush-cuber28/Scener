const User = require("../models/User");

function getAge(dateOfBirth) {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

// Can the person making this request see 18+ content?
// Guests: no. Admin: yes. Users: only if their date of birth says 18 or older.
async function canViewMature(req) {
  if (!req.user) return false;
  if (req.user.role === "admin") return true;
  const user = await User.findById(req.user.id).select("dateOfBirth");
  return Boolean(user) && getAge(user.dateOfBirth) >= 18;
}

module.exports = { getAge, canViewMature };
