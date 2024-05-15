"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const cors_1 = __importDefault(require("cors"));
const nanoid_1 = require("nanoid");
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const port = 3002;
const upload = (0, multer_1.default)();
app.use((0, cors_1.default)());
app.post("/upload", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.file && req.body.text) {
        const id = (0, nanoid_1.nanoid)();
        const scriptPath = "./src/script.py";
        try {
            // First update the ID in the Python script
            yield updatePythonScriptId(scriptPath, id);
            // Function to update ID in Python script
            function updatePythonScriptId(filePath, newId) {
                return new Promise((resolve, reject) => {
                    fs_1.default.readFile(filePath, 'utf8', (err, data) => {
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
                        }
                        else {
                            // Add the id variable at the end if not present
                            data = `id = "${newId}"\n` + data;
                        }
                        // Write the modified/new data back to the file
                        fs_1.default.writeFile(filePath, data, (err) => {
                            if (err) {
                                console.error('Failed to write to file:', err);
                                reject(err);
                            }
                            else {
                                console.log('Python script updated with new ID successfully');
                                resolve();
                            }
                        });
                    });
                });
            }
            // Upload user provided file to S3
            const formData = new form_data_1.default();
            formData.append("file", req.file.buffer, req.file.originalname);
            const s3Endpoint = `https://0o12h6c47i.execute-api.us-east-1.amazonaws.com/dev/fovus-challenge-bucket1/input/${req.file.originalname}`;
            yield axios_1.default.put(s3Endpoint, req.file.buffer, {
                headers: {
                    'Content-Type': req.file.mimetype,
                    'Content-Length': req.file.size
                }
            });
            // Upload updated Python script to S3
            const scriptFile = fs_1.default.readFileSync(scriptPath);
            const scriptFileName = "script.py";
            const secondS3Endpoint = `https://0o12h6c47i.execute-api.us-east-1.amazonaws.com/dev/fovus-challenge-bucket1/input/${scriptFileName}`;
            yield axios_1.default.put(secondS3Endpoint, scriptFile, {
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
            yield axios_1.default.post(dynamoDbEndpoint, data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            res.send("File uploaded and data stored successfully");
        }
        catch (error) {
            console.error("Error:", error);
            res.status(500).send("Error processing your request");
        }
    }
    else {
        res.status(400).send("File or text not provided");
    }
}));
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
