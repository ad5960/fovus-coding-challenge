import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import cors from "cors";
import { nanoid } from "nanoid";
import fs from "fs";

const app = express();
const port = 3002;
const upload = multer();

app.use(cors());

app.post("/upload", upload.single("file"), async (req, res) => {
  if (req.file && req.body.text) {
    const id = nanoid();
    const scriptPath = "./src/script.py";

    try {
      // First update the ID in the Python script
      await updatePythonScriptId(scriptPath, id);

      // Function to update ID in Python script
      function updatePythonScriptId(filePath: string, newId: string) {
        return new Promise<void>((resolve, reject) => {
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.error('Failed to read file:', err);
              reject(err);
              return;
            }

            // Check if the id variable is already present
            const idPattern = /^id = ".*"$/m;
            if (idPattern.test(data)) {
              // Replace the existing id value
              data = data.replace(idPattern, `id = "${newId}"`);
            } else {
              // Add the id variable at the end if not present
              data = `id = "${newId}"\n` + data;
            }

            // Write the modified/new data back to the file
            fs.writeFile(filePath, data, (err) => {
              if (err) {
                console.error('Failed to write to file:', err);
                reject(err);
              } else {
                console.log('Python script updated with new ID successfully');
                resolve();
              }
            });
          });
        });
      }

      // Upload user provided file to S3
      const formData = new FormData();
      formData.append("file", req.file.buffer, req.file.originalname);
      const s3Endpoint = `https://0o12h6c47i.execute-api.us-east-1.amazonaws.com/dev/fovus-challenge-bucket1/input/${req.file.originalname}`;
      await axios.put(s3Endpoint, req.file.buffer, {
        headers: {
          'Content-Type': req.file.mimetype,
          'Content-Length': req.file.size
        }
      });

      // Upload updated Python script to S3
      const scriptFile = fs.readFileSync(scriptPath);
      const scriptFileName = "script.py";
      const secondS3Endpoint = `https://0o12h6c47i.execute-api.us-east-1.amazonaws.com/dev/fovus-challenge-bucket1/input/${scriptFileName}`;
      await axios.put(secondS3Endpoint, scriptFile, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': scriptFile.length
        }
      });

      // File path format in S3
      const filePath = `s3://fovus-challenge-bucket1/input/${req.file.originalname}`;
      const data = {
        id: id,
        input_text: req.body.text,
        file_path: filePath,
      };

      // Send data to DynamoDB via API Gateway
      const dynamoDbEndpoint = "https://owo2i31jz3.execute-api.us-east-1.amazonaws.com/dev/file-info";
      await axios.post(dynamoDbEndpoint, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      res.send("File uploaded and data stored successfully");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Error processing your request");
    }
  } else {
    res.status(400).send("File or text not provided");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
