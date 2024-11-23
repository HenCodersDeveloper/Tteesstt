const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const dotenv = require("dotenv");

// Memuat variabel dari environment
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Konfigurasi AWS SDK untuk NevaCloud
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: true, // Penting untuk endpoint S3 kustom
});

// Konfigurasi Multer untuk mengunggah file
const upload = multer({ storage: multer.memoryStorage() });

// Route utama dengan form HTML sederhana
app.get("/", (req, res) => {
  res.send(`
    <h1>Upload File to NevaCloud</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file" required />
      <button type="submit">Upload</button>
    </form>
  `);
});

// Route untuk menangani unggahan file
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    // Konfigurasi parameter unggahan
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
    };

    // Unggah file ke NevaCloud
    const data = await s3.upload(params).promise();
    res.send(`File uploaded successfully: <a href="${data.Location}" target="_blank">${data.Location}</a>`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading file.");
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});