# 🙏 Achyuta Ananta Ashram Portal

A full-stack, enterprise-grade spiritual community portal built with the MERN stack (MongoDB, Express.js, React, Node.js). This platform provides a secure environment for devotees to manage their profiles, communicate in real-time, make donations, and stay updated, while giving administrators powerful tools to manage events, moderate chat groups, and maintain an interactive cloud gallery.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

## ✨ Core Features

### 💬 Real-Time Community Chat & Groups (WebSockets)
* **Live Messaging:** Bi-directional real-time communication powered by `Socket.io` with persistent MongoDB message histories.
* **Smart Pagination:** Memory-safe chunked pagination that loads older messages seamlessly without freezing the DOM.
* **Group Management:** Users can create custom groups, while Group Admins have exclusive permissions to add or remove members securely.

### 🔒 Zero-Trust Rich Media Sandbox
* **Secure Attachments:** Cloudinary integration for 10MB-capped multipart-form uploads, supporting images, videos, and documents.
* **File Whitelisting & Threat Mitigation:** Strict backend MIME-type checking. Documents and PDFs are intercepted by a custom React Sandbox requiring explicit user acknowledgment of potential malware before viewing.
* **Isolated iFrame Viewer:** Documents are rendered safely via the Google Docs Viewer API inside an isolated `iframe` (`sandbox="allow-scripts allow-same-origin"`) to prevent XSS execution.
* **Smart Parsing:** Integrated native dark-mode Emoji pickers and an auto-parsing Regex engine that converts plain-text URLs into clickable hyperlinks.

### 🔐 Secure Authentication & Role Management
* **JWT-Based Auth:** Secure login and registration with encrypted cookies/tokens.
* **Role-Based Access Control (RBAC):** Strict separation between Devotee profiles and the secure Admin Dashboard. Protected React routes and backend API endpoints.

### 📊 Advanced Analytics & Dashboards
* **Financial Data Engine:** MongoDB Aggregation pipelines instantly calculate and visualize complex donation and financial metrics for Super Admins.
* **Automated Scheduling:** Dynamic Event/Puja timeline logic with smart public-facing widgets.
* **Dynamic FAQ Engine:** Full CRUD support portal for Admins to draft and categorize frequent questions, rendered on the frontend via a sleek, animated accordion UI.

### 🖼️ Dynamic Cloud Gallery
* **Cloudinary Integration:** Direct image uploads from the admin dashboard to Cloudinary servers.
* **Smart Album Grouping:** Images are automatically sorted into specific "Event Albums" or a "General Archive."

### 💰 Seva (Donation) Management
* **Donation Tracking:** Users can view their complete donation history via their personal dashboard.
* **Instant PDF Receipts:** Client-side generation of branded, downloadable PDF receipts using `jspdf`.

### 📢 Admin Broadcast System
* **Bulk Newsletters:** Admins can broadcast rich-text emails to all verified users utilizing background queue processing to bypass strict SMTP rate limits.

### 🛡️ Enterprise Security & Logging
* **Rate Limiting & CORS:** Advanced IP-based rate limiting to prevent spam, with strict CORS origin protection.
* **Multi-Level Logging:** Integrated `morgan` for HTTP traffic monitoring and `winston` for persistent error logging and admin audit trails.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), React Router DOM, Socket.io-client, Emoji-Picker-React, Swiper.js, jsPDF
* **Backend:** Node.js, Express.js, Socket.io, Multer
* **Database:** MongoDB Atlas, Mongoose (with Aggregation Pipelines)
* **Cloud Storage:** Cloudinary (Images, Videos, Raw Documents)
* **Authentication:** JSON Web Tokens (JWT), bcryptjs
* **Infrastructure:** Vercel (Frontend Hosting), Render (Backend Hosting)

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone [https://github.com/Aditya-00001/Ashram.git](https://github.com/Aditya-00001/Ashram.git)
cd Ashram
```
### 2. Setup Environment Variables
Create a .env file in the <b>backend</b> folder and add the following:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
```

Create a .env file in the <b>frontend</b> folder and add:
```bash
Code snippet
VITE_API_URL=http://localhost:5000
```
### 3. Install Dependencies & Run
Open two terminal windows.

#### Terminal 1 (Backend):
```bash
cd backend
npm install
npm run dev
```
#### Terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
```
---
## 🌐 Live Deployment
**Frontend**: [Achyuta Ashram Portal](https://ashram-amber.vercel.app/)

**Status**: Production-Ready

Architected and developed with dedication to clean code, secure APIs, and responsive design.


***
