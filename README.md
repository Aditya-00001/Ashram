# 🙏 Achyuta Ananta Ashram Portal

A full-stack, enterprise-grade spiritual community portal built with the MERN stack (MongoDB, Express.js, React, Node.js). This platform provides a secure environment for devotees to manage their profiles, make donations, download receipts, and stay updated, while giving administrators powerful tools to manage events, broadcast newsletters, and maintain an interactive cloud gallery.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

## ✨ Core Features

### 🔐 Secure Authentication & Role Management
* **JWT-Based Auth:** Secure login and registration with encrypted cookies/tokens.
* **Email Verification:** OTP/6-digit code verification via Nodemailer before account activation.
* **Role-Based Access Control (RBAC):** Strict separation between Devotee profiles and the secure Admin Dashboard. Protected React routes and backend API endpoints.

### 🖼️ Dynamic Cloud Gallery
* **Cloudinary Integration:** Direct image uploads from the admin dashboard to Cloudinary servers.
* **Smart Album Grouping:** Images are automatically sorted into specific "Event Albums" or a "General Archive."
* **Multi-file Upload:** Admins can bulk-upload dozens of photos for a single event at once.

### 💰 Seva (Donation) Management
* **Donation Tracking:** Users can view their complete donation history via their personal dashboard.
* **Instant PDF Receipts:** Client-side generation of branded, downloadable PDF receipts using `jspdf`.
* **Payment Gateway Ready:** Architected with secure webhook endpoints (`payment.captured` / `payment.failed`) ready for Razorpay integration.

### 📢 Admin Broadcast System
* **Bulk Newsletters:** Admins can broadcast rich-text emails to all verified users.
* **Asynchronous Processing:** Emails are processed in a background queue to prevent UI blocking and bypass strict SMTP rate limits.

### 🛡️ Enterprise Security & Logging
* **Rate Limiting:** Advanced IP-based rate limiting to prevent spam and brute-force attacks.
* **CORS Protection:** Strictly configured to only accept traffic from verified frontend domains.
* **Multi-Level Logging:** Integrated `morgan` for HTTP traffic monitoring and `winston` for persistent error logging and admin audit trails.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), React Router DOM, Swiper.js (Image Carousels), jsPDF
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose
* **Cloud Storage:** Cloudinary (Images)
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
Create a .env file in the backend folder and add the following:

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
```bash
Create a .env file in the frontend folder and add:

Code snippet
VITE_API_URL=http://localhost:5000
```
### 3. Install Dependencies & Run
Open two terminal windows.

Terminal 1 (Backend):
```bash
cd backend
npm install
npm run dev
Terminal 2 (Frontend):
```
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
