/**
 * Lightweight Preview Dataset for Resume Template Gallery
 * 
 * Optimized for scaling and high readability. Short sections
 * prevent microscopic text walls and preserve clean A4 whitespace.
 */
export const PREVIEW_DATA = {
  personalInformation: {
    fullName: "Arthur Sherman",
    email: "arthur.sherman@example.com",
    phoneNumber: "+1 (555) 765-4321",
    location: "New York, NY",
    targetJobTitle: "Lead Systems Architect",
    profilePhoto: "",
    links: [
      { platform: "LinkedIn", url: "linkedin.com/in/arthursherman" },
      { platform: "GitHub", url: "github.com/arthursherman" },
      { platform: "Portfolio", url: "arthursherman.dev" }
    ]
  },
  // Legacy fields for robustness and backward-compatibility
  summary:
    "Distinguished Systems Architect and Lead Engineer with 8+ years of experience spearheading distributed cloud systems, high-throughput microservices, and cross-functional engineering teams.",
  skills: [
    { title: "Java & Spring Boot", level: "Expert" },
    { title: "Go (Golang)", level: "Expert" },
    { title: "React & TypeScript", level: "Advanced" },
    { title: "Docker & Kubernetes", level: "Expert" },
    { title: "AWS Cloud Platform", level: "Advanced" }
  ],
  experience: [
    {
      title: "Principal Software Architect",
      company: "Apex Enterprise Solutions",
      startDate: "Oct 2022",
      endDate: "Present",
      description:
        "Lead architectural design for high-throughput messaging system serving 1.2M active users. Migrated monolithic services to containerized Go microservices, reducing operational latency by 45%."
    },
    {
      title: "Senior Lead Engineer",
      company: "SaaS Systems Corp",
      startDate: "Mar 2019",
      endDate: "Sep 2022",
      description:
        "Managed a team of 6 engineers building cloud APIs. Implemented advanced Redis caching strategies, yielding a 55% database load reduction."
    }
  ],
  education: [
    {
      degree: "M.S. in Computer Science",
      institution: "Stanford University",
      startDate: "2017",
      endDate: "2019",
      description: "GPA: 3.9/4.0. Coursework: Advanced Algorithms, Cloud Infrastructure."
    }
  ],
  projects: [
    {
      title: "OpenTelemetry Scaler",
      description: "Automated auto-scaling operator for telemetry ingestion clusters.",
      link: "github.com/telemetry-scaler"
    }
  ],
  certifications: [
    {
      title: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      issueDate: "2023"
    }
  ],
  languages: [
    { language: "English", proficiency: "Native" }
  ],
  interests: [],

  // New modular sections array
  sections: [
    {
      id: "summary",
      type: "summary",
      title: "Professional Summary",
      data: "Distinguished Systems Architect and Lead Engineer with 8+ years of experience spearheading distributed cloud systems, high-throughput microservices, and cross-functional engineering teams.",
      order: 0,
      visible: true
    },
    {
      id: "experience",
      type: "experience",
      title: "Work Experience",
      data: [
        {
          title: "Principal Software Architect",
          company: "Apex Enterprise Solutions",
          startDate: "Oct 2022",
          endDate: "Present",
          description: "Lead architectural design for high-throughput messaging system serving 1.2M active users. Migrated monolithic services to containerized Go microservices, reducing operational latency by 45%."
        },
        {
          title: "Senior Lead Engineer",
          company: "SaaS Systems Corp",
          startDate: "Mar 2019",
          endDate: "Sep 2022",
          description: "Managed a team of 6 engineers building cloud APIs. Implemented advanced Redis caching strategies, yielding a 55% database load reduction."
        }
      ],
      order: 1,
      visible: true
    },
    {
      id: "education",
      type: "education",
      title: "Education",
      data: [
        {
          degree: "M.S. in Computer Science",
          institution: "Stanford University",
          startDate: "2017",
          endDate: "2019",
          description: "GPA: 3.9/4.0. Coursework: Advanced Algorithms, Cloud Infrastructure."
        }
      ],
      order: 2,
      visible: true
    },
    {
      id: "skills",
      type: "skills",
      title: "Skills",
      data: [
        { title: "Java & Spring Boot", level: "Expert" },
        { title: "Go (Golang)", level: "Expert" },
        { title: "React & TypeScript", level: "Advanced" },
        { title: "Docker & Kubernetes", level: "Expert" },
        { title: "AWS Cloud Platform", level: "Advanced" }
      ],
      order: 3,
      visible: true
    },
    {
      id: "projects",
      type: "projects",
      title: "Projects",
      data: [
        {
          title: "OpenTelemetry Scaler",
          description: "Automated auto-scaling operator for telemetry ingestion clusters.",
          link: "github.com/telemetry-scaler"
        }
      ],
      order: 4,
      visible: true
    },
    {
      id: "certifications",
      type: "certifications",
      title: "Certifications",
      data: [
        {
          title: "AWS Solutions Architect",
          issuer: "Amazon Web Services",
          issueDate: "2023"
        }
      ],
      order: 5,
      visible: true
    },
    {
      id: "languages",
      type: "languages",
      title: "Languages",
      data: [
        { language: "English", proficiency: "Native" }
      ],
      order: 6,
      visible: true
    }
  ]
};
