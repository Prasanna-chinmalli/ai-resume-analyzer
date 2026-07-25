# 🤖 AI Resume Analyzer

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?logo=openai)
![License](https://img.shields.io/badge/License-MIT-green)

An AI-powered web application that analyzes resumes against job descriptions to generate an ATS compatibility score, identify matched and missing skills, and provide AI-driven recommendations for improving resume quality.

---

<p align="center">
  <img src="screenshots/home.png" alt="AI Resume Analyzer Home Page" width="900">
</p>

---

## 🎯 Key Highlights

- 🚀 AI-powered ATS Resume Analyzer
- 🤖 OpenAI API Integration
- 📄 Intelligent PDF Parsing
- 📊 ATS Score & Skill Matching
- ⚡ Full Stack React + Node.js Application

---

##  **Live Application**

🌐 https://ai-resume-analyzer-eosin-six.vercel.app/

---

## ✨ Features

---

- 📄 Upload Resume (PDF)
- 💼 Upload Job Description (PDF)
- 🤖 AI-powered Resume Analysis
- 📊 ATS Compatibility Score
- ✅ Matched Skills Detection
- ❌ Missing Skills Identification
- 💡 Personalized Improvement Suggestions
- 📥 Download Analysis Report
- 📱 Responsive User Interface

---

# 📸 Screenshots

## 📤 Upload Resume & Job Description

![Home](screenshots/home.png)

---

## 📊 Analysis Results

![Analysis](screenshots/analysis.png)

---

## 📄 Generated Report

![Report](screenshots/report.png)

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React.js, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| AI | OpenAI API |
| Libraries | pdf-parse, jsPDF |
| Deployment | Vercel |

---

### Deployment
- Vercel

---

## Architecture Diagram 

```mermaid
flowchart TD

    A[User] --> B[React Frontend (Vercel)]
    B --> C[Upload Resume & Job Description]
    C --> D[Express.js Backend]

    D --> E[PDF Parser]
    D --> F[OpenAI API]

    E --> G[ATS Analysis Engine]
    F --> G

    G --> H[Analysis Report (PDF)]
```

--- 

## 📂 Project Structure

```text
ai-resume-analyzer/
│
├── backend/
├── frontend/
├── screenshots/
├── .gitignore
├── LICENSE
└── README.md
```
---
       
## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Prasanna-chinmalli/ai-resume-analyzer.git
```

Install frontend dependencies

```bash
cd frontend
npm install
npm starts
```

Install backend dependencies

```bash
cd backend
npm install
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
OPENAI_API_KEY=your_api_key
PORT=5000
```

---

## 📖 How It Works

1. Upload your Resume (PDF)
2. Upload the Job Description (PDF)
3. AI extracts and analyzes the content
4. View ATS Score
5. Review matched and missing skills
6. Download the generated report

---

## 🔮 Future Enhancements

- Resume History
- User Authentication
- Multiple Resume Comparison
- LinkedIn Profile Analysis
- AI Interview Preparation
- Multi-language Support

---

## 👨‍💻 Author

**Prasanna Chinmalli**

- GitHub: https://github.com/Prasanna-chinmalli
- LinkedIn: https://www.linkedin.com/in/prasanna-v-chinmalli-05175a278/