// Poster storage.
// If Cloudinary keys are set (CLOUDINARY_URL, or the 3 separate keys), posters go to Cloudinary.
// Otherwise (local development) they are saved to the backend/uploads folder.
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const uploadDir = path.join(__dirname, "../../uploads");

function cloudinaryEnabled() {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  );
}

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true); // reads CLOUDINARY_URL
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  cloudinary.config({ secure: true });
}

// file = the object multer gives us (memory storage). Returns { url, id }.
async function savePoster(file) {
  if (cloudinaryEnabled()) {
    configureCloudinary();
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "scener/posters", resource_type: "image" },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, id: result.public_id };
  }

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const name = Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(file.originalname || ".jpg");
  await fs.promises.writeFile(path.join(uploadDir, name), file.buffer);
  return { url: `/uploads/${name}`, id: "" };
}

// Removes an old poster. Never throws: a failed cleanup should not break the request.
async function deletePoster(url, id) {
  try {
    if (id && cloudinaryEnabled()) {
      configureCloudinary();
      await cloudinary.uploader.destroy(id);
    } else if (url && url.startsWith("/uploads/")) {
      await fs.promises.unlink(path.join(uploadDir, path.basename(url)));
    }
  } catch (error) {
    console.error("Could not delete old poster:", error.message);
  }
}

module.exports = { savePoster, deletePoster, cloudinaryEnabled };
