import React, { useState } from 'react';
import './App.css';
import { Button, Label, TextInput, FileInput } from "flowbite-react";
import axios from 'axios';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');

  // Handle the file input change event
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  // Handle the text input change event
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission behavior
    if (file && text) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('text', text);

      try {
        // Send a POST request to the server with the form data
        const response = await axios.post('http://localhost:3002/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('File uploaded successfully:', response.data);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  return (
    <div className="App">
      <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <div className="mb-2 block">
            <Label className="text-white" htmlFor="text" value="Text Input" />
          </div>
          <TextInput className="mb-2" id="text" type="text" placeholder="Example Text" required onChange={handleTextChange} />
        </div>
        <div id="fileUpload" className="max-w-md">
          <div className="mb-2 block">
            <Label className="text-white" htmlFor="file" value="Upload file" />
          </div>
          <FileInput className="mb-4" id="file" onChange={handleFileChange} />
        </div>
        <Button className="bg-indigo-500 hover:bg-indigo-600" type="submit">Submit</Button>
      </form>
    </div>
  );
}

export default App;
