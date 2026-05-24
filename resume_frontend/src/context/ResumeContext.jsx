import { createContext, useContext, useState, useEffect } from 'react';

const ResumeContext = createContext();

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};

export const ResumeProvider = ({ children }) => {
  const [resumeData, setResumeData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('executive');
  const [selectedTheme, setSelectedTheme] = useState('slate');
  const [selectedFont, setSelectedFont] = useState('inter');
  const [isEnhanced, setIsEnhanced] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedResumeData = localStorage.getItem('resumeData');
    const savedTemplate = localStorage.getItem('selectedTemplate');
    const savedTheme = localStorage.getItem('selectedTheme');
    const savedFont = localStorage.getItem('selectedFont');
    const savedEnhanced = localStorage.getItem('isEnhanced');
    
    if (savedResumeData) {
      try {
        setResumeData(JSON.parse(savedResumeData));
      } catch (error) {
        console.error('Error parsing saved resume data:', error);
        localStorage.removeItem('resumeData');
      }
    }
    
    if (savedTemplate) {
      setSelectedTemplate(savedTemplate);
    }
    if (savedTheme) {
      setSelectedTheme(savedTheme);
    }
    if (savedFont) {
      setSelectedFont(savedFont);
    }
    if (savedEnhanced) {
      setIsEnhanced(savedEnhanced === 'true');
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (resumeData) {
      localStorage.setItem('resumeData', JSON.stringify(resumeData));
    }
  }, [resumeData]);

  useEffect(() => {
    localStorage.setItem('selectedTemplate', selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    localStorage.setItem('selectedTheme', selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    localStorage.setItem('selectedFont', selectedFont);
  }, [selectedFont]);

  useEffect(() => {
    localStorage.setItem('isEnhanced', isEnhanced.toString());
  }, [isEnhanced]);

  const updateResumeData = (newData) => {
    setResumeData(newData);
    setIsEnhanced(false);
  };

  const updateTemplate = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const updateTheme = (themeId) => {
    setSelectedTheme(themeId);
  };

  const updateFont = (fontId) => {
    setSelectedFont(fontId);
  };

  const clearResumeData = () => {
    setResumeData(null);
    setSelectedTemplate('executive');
    setSelectedTheme('slate');
    setSelectedFont('inter');
    setIsEnhanced(false);
    localStorage.removeItem('resumeData');
    localStorage.removeItem('selectedTemplate');
    localStorage.removeItem('selectedTheme');
    localStorage.removeItem('selectedFont');
    localStorage.removeItem('isEnhanced');
  };

  const markAsEnhanced = () => {
    setIsEnhanced(true);
  };

  const value = {
    resumeData,
    selectedTemplate,
    selectedTheme,
    selectedFont,
    isEnhanced,
    updateResumeData,
    updateTemplate,
    updateTheme,
    updateFont,
    clearResumeData,
    markAsEnhanced,
    hasResumeData: !!resumeData,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};