🏆 Honourable Mention - NVCTI HACKATHON 2026

# JobVector: Bi-Directional RAG Recruiting Engine

JobVector is an advanced, AI-powered talent matching platform designed to connect job seekers with employers using state-of-the-art semantic search. By utilizing a bi-directional Retrieval-Augmented Generation (RAG) pipeline, JobVector intelligently matches candidates to optimal roles and ranks incoming applicants for recruiters.

## 🚀 Key AI Features

- **Bi-Directional RAG Pipeline**: Intelligently recommends jobs to candidates and ranks applicants for recruiters using a multi-stage retrieval system and LLM-based reranking.
- **Hybrid Search with RRF**: Utilizes Reciprocal Rank Fusion (RRF) in Pinecone, combining dense semantic vector embeddings with sparse keyword matching to drastically improve recommendation accuracy and recall.
- **Multimodal Resume Parsing**: Bypasses legacy text extraction by streaming raw PDF binaries directly to Google Gemini's multimodal API, securely extracting factual project details and skills to feed the semantic vector pipeline.
- **Real-Time AI Interview Coach**: Performs delta-analysis between a candidate's profile and specific job requirements to generate customized gap-improvement plans and targeted technical study topics.
- **Dynamic Asynchronous UI**: A responsive, visually striking React interface featuring engaging micro-animations and technical loading states to mask latency during complex LLM reranking queries.

## 🛠 Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS
- **Routing**: React Router
- **HTTP Client**: Axios

### Backend & AI Infrastructure
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Vector Database**: Pinecone
- **LLM / Generative AI**: Google Gemini API (gemini-1.5-flash)
- **Language**: TypeScript

## 📂 Project Structure

The project is divided into two main directories:

- **`Backend-Starter-main`**: Contains the Node.js/Express backend API, AI service logic, and Pinecone integrations.
- **`frontend`**: Contains the React frontend application.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas connection string)
- Pinecone Account (for Vector Database)
- Google Gemini API Key

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
   Create a `.env` file in the `Backend-Starter-main` directory with the following variables:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/job-matching-db
   GEMINI_API_KEY=your_gemini_api_key_here
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_ENVIRONMENT=your_pinecone_env
   PINECONE_INDEX=your_pinecone_index_name
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
