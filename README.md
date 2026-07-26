<img width="1911" height="872" alt="image" src="https://github.com/user-attachments/assets/abfb3304-18f1-4c3b-b4df-4cf9d6e4beb0" /># CareerDraft AI — Intelligent Resume Builder & ATS Analyzer

An intelligent resume builder web application that leverages AI (DeepSeek R1 model) to generate personalized resumes based on user input. The app is built using **Spring Boot** for the backend and **React.js with Tailwind CSS** for the frontend.

---

## 📁 Project Structure

```
sachinskill-ai-resume-builder/
├── resume-ai-backend/       # Spring Boot backend
└── resume_frontend/         # React frontend with Tailwind CSS
```

---

## 🚀 Features

### 🛠 Backend (`resume-ai-backend`)
- Built with **Spring Boot**
- API for resume generation using AI (DeepSeek R1)
- Template-driven resume creation
- JSON-based user request/response handling
- Export resume as PDF/DOCX
- Secure configuration using `application.properties`

### 🎨 Frontend (`resume_frontend`)
- Built with **React.js**, **Vite**, **Tailwind CSS**
- Page-based navigation using React Router
- Real-time preview of AI-generated resumes
- User-friendly landing page and resume form
- Fully responsive and mobile-friendly design

---

## 🧪 Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React.js, Tailwind CSS, Vite  |
| Backend     | Spring Boot, Java             |
| AI/NLP      | DeepSeek R1                   |
| Data        | Resume templates (Text Files) |
| Dev Tools   | Git, Postman, Maven           |

---

## 🛠️ Getting Started

### Prerequisites
- Java 17+
- Node.js & npm
- Maven

### Backend Setup
```bash
cd resume-ai-backend
./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd resume_frontend
npm install
npm run dev
```

### Environment Configuration
- Configure your AI API key and endpoint in `application.properties`
- Optionally, add CORS and error handling middleware in backend

---

## 📷 Screenshots

![Landing Page)
<img width="1911" height="872" alt="image" src="https://github.com/user-attachments/assets/36dec99f-2b08-4033-8996-79cdb05ccf13" />

*Modern responsive landing page featuring direct onboarding and key visual callouts.*

![ATS Analysis](./screenshots/ats-analysis.png)
*Detailed 6-dimensional ATS scoring, keyword gap analysis, and contextual tailoring tips.*

![Dashboard](./screenshots/dashboard.png)
*Pro user dashboard showing history, version rollbacks, and payment settings.*

> Add your own screenshots to a `screenshots/` folder in the repo root using the filenames above (`landing.png`, `ats-analysis.png`, `dashboard.png`), or update the paths here to match whatever you name them.

---

## 🤝 Contributing

Contributions, ideas, and suggestions are welcome!  
1. Fork the repository  
2. Create a new branch (`git checkout -b feature/YourFeature`)  
3. Commit your changes (`git commit -am 'Add a new feature'`)  
4. Push to the branch (`git push origin feature/YourFeature`)  
5. Open a Pull Request

---

## 📄 License

This project is open-source under the MIT License.

---

## 👨‍💻 Author

Made with 💙 by [Sachin Gupta](https://github.com/sachinskill)
