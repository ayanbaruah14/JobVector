🏆 Honourable Mention - NVCTI HACKATHON 2026

# Trivalent Job Board

Trivalent is a comprehensive full-stack recruitment platform designed to connect job seekers with employers efficiently. It features AI-powered job recommendations, intelligent resume parsing, and a seamless application process.

## 🚀 Features

- **User & Company Authentication**: Secure signup and login for both job seekers and providers.
- **Smart Job Matching**: AI-driven job recommendations based on candidate profiles.
- **Resume Parsing**: Automatically extracts skills and experience from PDF resumes.
- **Job Management**: Providers can easily post and manage job listings.
- **Application Tracking**: Applicants can track their applications, and providers can review applicants.
- **Modern UI**: A responsive and visually appealing interface built with React and TailwindCSS.

## 🛠 Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS
- **Routing**: React Router
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Language**: TypeScript
- **AI/ML**: OpenAI API (for matching and parsing)

## 📂 Project Structure

The project is divided into two main directories:

- **`Backend-Starter-main`**: Contains the Node.js/Express backend API.
- **`frontend`**: Contains the React frontend application.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas connection string)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend-Starter-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `Backend-Starter-main` directory. You can calculate the following values:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/job-matching-db
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application should now be running (usually at `http://localhost:5173`) and communicating with your backend server.
