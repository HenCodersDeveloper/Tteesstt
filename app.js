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
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        #progressWrapper {
          margin-top: 20px;
          width: 100%;
        }
        #progressBar {
          width: 100%;
          height: 20px;
          margin-top: 10px;
        }
        #progressPercentage {
          display: block;
          text-align: center;
          margin-top: 5px;
          font-weight: bold;
        }
        form {
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <h1>Upload File to NevaCloud</h1>
      <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" required />
        <button type="submit">Upload</button>
      </form>
      <div id="progressWrapper" style="display:none;">
        <progress id="progressBar" value="0" max="100"></progress>
        <span id="progressPercentage">0%</span>
      </div>
      <script>
        const form = document.getElementById('uploadForm');
        form.addEventListener('submit', function(event) {
          event.preventDefault();
          const formData = new FormData(form);
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/upload');
          
          xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
              const percent = (e.loaded / e.total) * 100;
              document.getElementById('progressWrapper').style.display = 'block';
              document.getElementById('progressBar').value = percent;
              document.getElementById('progressPercentage').textContent = Math.round(percent) + '%';
            }
          };
          
          xhr.onload = function() {
            if (xhr.status === 200) {
              alert('File uploaded successfully!');
            } else {
              alert('Error uploading file.');
            }
          };
          
          xhr.send(formData);
        });
      </script>
    </body>
    </html>
  `);
});

// Route untuk menangani unggahan file
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
    };

    // Unggah file ke NevaCloud dengan mengaktifkan progress tracking
    s3.upload(params)
      .on('httpUploadProgress', (progress) => {
        console.log(`Uploaded ${progress.loaded} of ${progress.total} bytes`);
      })
      .send((err, data) => {
        if (err) {
          return res.status(500).send("Error uploading file.");
        }
        res.send(`File uploaded successfully: <a href="${data.Location}" target="_blank">${data.Location}</a>`);
      });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading file.");
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
