import { FaGithub, FaLinkedin, FaPhone, FaEnvelope } from "react-icons/fa";

const MinimalistTemplate = ({ data }) => {
  return (
    <div className="p-6 bg-white text-gray-800 space-y-6">
      {/* Header Section */}
      <header className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-light tracking-wider text-gray-900 mb-1">
          {data.personalInformation.fullName}
        </h1>
        <p className="text-sm text-gray-500 mb-3">
          {data.personalInformation.location}
        </p>
        
        <div className="flex flex-wrap gap-4 text-xs">
          {data.personalInformation.email && (
            <a
              href={`mailto:${data.personalInformation.email}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <span className="flex items-center">
                <FaEnvelope className="mr-1" size={10} /> {data.personalInformation.email}
              </span>
            </a>
          )}
          {data.personalInformation.phoneNumber && (
            <span className="text-gray-600">
              <FaPhone className="inline mr-1" size={10} /> {data.personalInformation.phoneNumber}
            </span>
          )}
          {data.personalInformation.gitHub && (
            <a
              href={data.personalInformation.gitHub}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <span className="flex items-center">
                <FaGithub className="mr-1" size={10} /> GitHub
              </span>
            </a>
          )}
          {data.personalInformation.linkedIn && (
            <a
              href={data.personalInformation.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <span className="flex items-center">
                <FaLinkedin className="mr-1" size={10} /> LinkedIn
              </span>
            </a>
          )}
        </div>
      </header>

      {/* Summary Section */}
      <section>
        <h2 className="text-base font-medium text-gray-900 mb-2">Summary</h2>
        <p className="text-gray-700 text-xs leading-relaxed">
          {data.summary || "Professional summary will be displayed here."}
        </p>
      </section>

      {/* Skills Section */}
      <section>
        <h2 className="text-base font-medium text-gray-900 mb-2">Skills</h2>
        <div className="flex flex-wrap gap-1">
          {data.skills && data.skills.length > 0 ? (
            data.skills.map((skill, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded"
              >
                {skill.title} {skill.level && `(${skill.level})`}
              </span>
            ))
          ) : (
            <div className="text-gray-400 text-xs">Skills will be displayed here</div>
          )}
        </div>
      </section>

      {/* Experience Section */}
      <section>
        <h2 className="text-base font-medium text-gray-900 mb-3">Experience</h2>
        <div className="space-y-4">
          {data.experience && data.experience.length > 0 ? (
            data.experience.map((exp, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-medium">{exp.jobTitle || exp.title}</h3>
                  <span className="text-xs text-gray-500">
                    {exp.duration || `${exp.startDate} - ${exp.endDate || "Present"}`}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{exp.company}</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {exp.responsibility || exp.description}
                </p>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-xs">Professional experience will be displayed here</div>
          )}
        </div>
      </section>

      {/* Education Section */}
      <section>
        <h2 className="text-base font-medium text-gray-900 mb-3">Education</h2>
        <div className="space-y-4">
          {data.education && data.education.length > 0 ? (
            data.education.map((edu, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-medium">{edu.degree}</h3>
                  <span className="text-xs text-gray-500">
                    {edu.graduationYear || `${edu.startDate} - ${edu.endDate || "Present"}`}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{edu.university || edu.institution}</p>
                {edu.description && (
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {edu.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-xs">Educational background will be displayed here</div>
          )}
        </div>
      </section>

      {/* Bottom Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects Section */}
        <section>
          <h2 className="text-base font-medium text-gray-900 mb-3">Projects</h2>
          <div className="space-y-3">
            {data.projects && data.projects.length > 0 ? (
              data.projects.map((project, index) => (
                <div key={index} className="mb-2">
                  <h3 className="text-sm font-medium mb-1">{project.title}</h3>
                  <p className="text-xs text-gray-700 leading-relaxed mb-1">
                    {project.description}
                  </p>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-gray-900 underline"
                    >
                      View Project
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-xs">Projects will be displayed here</div>
            )}
          </div>
        </section>

        {/* Certifications Section */}
        <section>
          <h2 className="text-base font-medium text-gray-900 mb-3">Certifications</h2>
          <div className="space-y-2">
            {data.certifications && data.certifications.length > 0 ? (
              data.certifications.map((cert, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-medium">{cert.title}</h3>
                    <span className="text-xs text-gray-500">{cert.year || cert.issueDate}</span>
                  </div>
                  <p className="text-xs text-gray-600">{cert.issuingOrganization || cert.issuer}</p>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-xs">Certifications will be displayed here</div>
            )}
          </div>
        </section>

        {/* Languages Section */}
        <section>
          <h2 className="text-base font-medium text-gray-900 mb-3">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {data.languages && data.languages.length > 0 ? (
              data.languages.map((lang, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{lang.name || lang.language}</span>
                  <span className="text-gray-600 text-xs ml-1">
                    ({lang.proficiency || 'Fluent'})
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-xs">Languages will be displayed here</div>
            )}
          </div>
        </section>

        {/* Interests Section */}
        <section>
          <h2 className="text-base font-medium text-gray-900 mb-3">Interests</h2>
          <div className="flex flex-wrap gap-1">
            {data.interests && data.interests.length > 0 ? (
              data.interests.map((interest, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded"
                >
                  {interest.name || interest.interest}
                </span>
              ))
            ) : (
              <div className="text-gray-400 text-xs">Interests will be displayed here</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MinimalistTemplate; 