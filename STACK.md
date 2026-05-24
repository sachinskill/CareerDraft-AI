# STACK.md

## Frontend Stack
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0.5
- **Styling**: Tailwind CSS 3.4.17 + DaisyUI 4.12.23
- **Navigation**: React Router DOM 6.23.1
- **State Management**: React Context API
- **Forms**: React Hook Form 7.54.2
- **HTTP Client**: Axios 1.7.9
- **Notifications**: React Hot Toast 2.5.1
- **PDF Generation**: jsPDF 3.0.0

## Backend Stack
- **Language**: Java 21
- **Framework**: Spring Boot 3.4.3
- **AI Integration**: Spring AI (with Ollama)
- **PDF Parsing**: Apache PDFBox 2.0.29
- **DOCX Parsing**: Apache POI 5.2.5
- **JSON Processing**: Jackson (FasterXML)
- **Build System**: Maven

## AI & ML
- **Server**: Ollama (Localized Inference)
- **Model**: DeepSeek-R1 (1.5b)
- **Integration**: `ChatClient` (Spring AI)

## Infrastructure (Local/Dev)
- **Backend Port**: 8081
- **Frontend Port**: 5173 (Vite default)
- **Ollama Port**: 11434 (Ollama default)
- **Storage**: Browser LocalStorage & In-Memory (No persistent DB yet)
