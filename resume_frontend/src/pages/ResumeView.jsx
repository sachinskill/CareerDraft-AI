import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "../context/ResumeContext";
import Resume from "../components/Resume";

const ResumeView = () => {
  const { resumeData, hasResumeData } = useResume();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to generate page if no resume data exists
    if (!hasResumeData) {
      navigate("/generate-resume");
    }
  }, [hasResumeData, navigate]);

  if (!hasResumeData) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>No resume data found. Redirecting to generator...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <button
          onClick={() => navigate("/generate-resume")}
          className="btn btn-outline btn-primary"
        >
          ← Back to Editor
        </button>
      </div>
      <Resume 
        data={resumeData} 
        showTemplateSelector={true}
      />
    </div>
  );
};

export default ResumeView;