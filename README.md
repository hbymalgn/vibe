# Project Title: Web-Based Design Editor

## Overview
This project is a web-based design editor that allows users to create and modify designs using a drag-and-drop interface. Users can log in with their email accounts, manage their projects, and export their designs in various formats.

## Features
- **Email Authentication**: Users can log in and manage their accounts.
- **Design Canvas**: A flexible canvas for creating designs with text, images, and shapes.
- **Template Management**: Users can load and save their projects in JSON format.
- **Export Options**: Designs can be exported as PNG, JPG, or PDF.
- **User Dashboard**: A dedicated page for users to view their saved projects.
- **Account Management**: Users can delete their accounts and log out.

## Project Structure
```
vibe
├── index.html
├── css
│   ├── main.css
│   └── editor.css
├── js
│   ├── main.js
│   ├── auth.js
│   ├── editor.js
│   └── canvas
│       ├── canvasController.js
│       └── objectRenderer.js
├── pages
│   ├── login.html
│   ├── dashboard.html
│   ├── editor.html
│   └── account
│       ├── delete.html
│       └── logout.html
├── templates
│   └── sample-template.json
├── api
│   ├── server.js
│   ├── routes
│   │   ├── auth.js
│   │   └── projects.js
│   ├── controllers
│   │   ├── authController.js
│   │   └── projectController.js
│   ├── models
│   │   └── userModel.js
│   └── middleware
│       └── authMiddleware.js
├── storage
│   └── uploads
├── package.json
├── .env.example
└── README.md
```

## Setup Instructions
1. **Clone the Repository**: 
   ```
   git clone <repository-url>
   cd vibe
   ```

2. **Install Dependencies**: 
   ```
   npm install
   ```

3. **Environment Variables**: 
   Copy `.env.example` to `.env` and fill in the required variables.

4. **Run the Server**: 
   ```
   npm start
   ```

5. **Access the Application**: 
   Open your browser and navigate to `http://localhost:3000`.

## Usage Guidelines
- Users can create an account or log in using their email.
- The dashboard displays all saved projects.
- The editor allows users to create designs using various tools.
- Users can export their designs in different formats.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License.