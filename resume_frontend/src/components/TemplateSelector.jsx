import React, { useState } from "react";
import DefaultTemplate from "./Templates/DefaultTemplate";
import ModernTemplate from "./Templates/ModernTemplate";
import MinimalistTemplate from "./Templates/MinimalistTemplate";

const TemplateSelector = ({ selectedTemplate, onSelectTemplate, showPreview = true }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  const templates = [
    {
      id: "default",
      name: "Default",
      description: "A classic professional resume layout",
      thumbnail: "/templates/default-thumbnail.svg",
    },
    {
      id: "modern",
      name: "Modern",
      description: "A contemporary design with a colorful header",
      thumbnail: "/templates/modern-thumbnail.svg",
    },
    {
      id: "minimalist",
      name: "Minimalist",
      description: "A clean, simple design with elegant typography",
      thumbnail: "/templates/minimalist-thumbnail.svg",
    },
  ];

  // Sample data for preview
  const sampleData = {
    personalInformation: {
      fullName: "John Doe",
      email: "john.doe@example.com",
      phoneNumber: "+1 (555) 123-4567",
      location: "New York, NY",
      gitHub: "https://github.com/johndoe",
      linkedIn: "https://linkedin.com/in/johndoe",
    },
    summary: "Experienced software developer with expertise in web development and a passion for creating user-friendly applications.",
    skills: [
      { title: "JavaScript", level: "Advanced" },
      { title: "React", level: "Advanced" },
      { title: "Node.js", level: "Intermediate" },
    ],
    experience: [
      {
        title: "Senior Developer",
        company: "Tech Solutions Inc.",
        startDate: "2020",
        endDate: "Present",
        description: "Led development of web applications using React and Node.js.",
      },
      {
        title: "Web Developer",
        company: "Digital Creations",
        startDate: "2018",
        endDate: "2020",
        description: "Developed responsive websites and web applications.",
      },
    ],
    education: [
      {
        degree: "B.S. Computer Science",
        institution: "University of Technology",
        startDate: "2014",
        endDate: "2018",
        description: "Graduated with honors. Focused on web technologies and software engineering.",
      },
    ],
    certifications: [
      {
        title: "AWS Certified Developer",
        issuer: "Amazon Web Services",
        issueDate: "2021",
        description: "Certification for AWS cloud development.",
      },
    ],
    projects: [],
    languages: [],
    interests: [],
  };

  // Render preview template
  const renderPreviewTemplate = (templateId) => {
    switch (templateId) {
      case "modern":
        return <ModernTemplate data={sampleData} />;
      case "minimalist":
        return <MinimalistTemplate data={sampleData} />;
      case "default":
      default:
        return <DefaultTemplate data={sampleData} />;
    }
  };

  const handleTemplateSelect = (templateId) => {
    onSelectTemplate(templateId);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id
                ? "border-primary ring-2 ring-primary ring-opacity-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <div className="aspect-[3/4] relative bg-gray-100 flex items-center justify-center">
              {/* Placeholder for template thumbnail */}
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-gray-600 mb-2">
                  {template.name}
                </div>
                <div className="text-sm text-gray-500">
                  Template Preview
                </div>
              </div>
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium">{template.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{template.description}</p>
              <div className="flex justify-between">
                {showPreview && (
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template.id);
                    }}
                  >
                    Preview
                  </button>
                )}
                <button 
                  className={`text-xs ${
                    selectedTemplate === template.id 
                      ? "text-green-600 font-semibold" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(template.id);
                  }}
                >
                  {selectedTemplate === template.id ? "✓ Selected" : "Select"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {templates.find(t => t.id === previewTemplate)?.name} Template Preview
              </h3>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
              <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142.86%' }}>
                {renderPreviewTemplate(previewTemplate)}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  handleTemplateSelect(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="btn btn-primary"
              >
                Select This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector; 