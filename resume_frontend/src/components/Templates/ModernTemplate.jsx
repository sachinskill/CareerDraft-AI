import { FaGithub, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const ModernTemplate = ({ data }) => {
  return (
    <div className="bg-white overflow-hidden">
      {/* Header Section with Background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white p-6">
        <h1 className="text-3xl font-bold mb-3">
          {data.personalInformation.fullName}
        </h1>
        
        <div className="flex flex-wrap gap-4 text-sm">
          {data.personalInformation.email && (
            <a
              href={`mailto:${data.personalInformation.email}`}
              className="flex items-center hover:underline"
            >
              <FaEnvelope className="mr-1" /> {data.personalInformation.email}
            </a>
          )}
          {data.personalInformation.phoneNumber && (
            <p className="flex items-center">
              <FaPhone className="mr-1" /> {data.personalInformation.phoneNumber}
            </p>
          )}
          {data.personalInformation.location && (
            <p className="flex items-center">
              <FaMapMarkerAlt className="mr-1" /> {data.personalInformation.location}
            </p>
          )}
        </div>
        
        <div className="mt-2 flex gap-4 text-sm">
          {data.personalInformation.gitHub && (
            <a
              href={data.personalInformation.gitHub}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:underline"
            >
              <FaGithub className="mr-1" /> GitHub
            </a>
          )}
          {data.personalInformation.linkedIn && (
            <a
              href={data.personalInformation.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:underline"
            >
              <FaLinkedin className="mr-1" /> LinkedIn
            </a>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Section */}
        <section>
          <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
            Summary
          </h2>
          <p className="text-gray-700 text-sm">
            {data.summary || "Professional summary will be displayed here."}
          </p>
        </section>

        {/* Two Column Layout for Skills and Experience */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-1 space-y-6">
            {/* Skills Section */}
            <section>
              <h2 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
                Skills
              </h2>
              <div className="space-y-2">
                {data.skills && data.skills.length > 0 ? (
                  data.skills.map((skill, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-medium">{skill.title}</span>
                      <span className="text-blue-600 font-semibold">{skill.level}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">Skills will be displayed here</div>
                )}
              </div>
            </section>

            {/* Languages Section */}
            <section>
              <h2 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
                Languages
              </h2>
              <div className="space-y-2">
                {data.languages && data.languages.length > 0 ? (
                  data.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-medium">{lang.name || lang.language}</span>
                      <span className="text-blue-600 font-semibold">{lang.proficiency || 'Fluent'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">Languages will be displayed here</div>
                )}
              </div>
            </section>

            {/* Interests Section */}
            <section>
              <h2 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.interests && data.interests.length > 0 ? (
                  data.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                    >
                      {interest.name || interest.interest}
                    </span>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">Interests will be displayed here</div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Experience Section */}
            <section>
              <h2 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
                Experience
              </h2>
              <div className="space-y-4">
                {data.experience && data.experience.length > 0 ? (
                  data.experience.map((exp, index) => (
                    <div key={index} className="relative pl-4 border-l-2 border-blue-200 pb-4">
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full -left-[5px] top-1"></div>
                      <h3 className="text-base font-bold text-gray-800">
                        {exp.jobTitle || exp.title} | {exp.company}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {exp.duration || `${exp.startDate} - ${exp.endDate || "Present"}`}
                      </p>
                      <p className="text-gray-700 text-sm">{exp.responsibility || exp.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">Professional experience will be displayed here</div>
                )}
              </div>
            </section>

            {/* Education Section */}
            <section>
              <h2 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
                Education
              </h2>
              <div className="space-y-4">
                {data.education && data.education.length > 0 ? (
                  data.education.map((edu, index) => (
                    <div key={index} className="relative pl-4 border-l-2 border-blue-200 pb-4">
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full -left-[5px] top-1"></div>
                      <h3 className="text-base font-bold text-gray-800">
                        {edu.degree} | {edu.university || edu.institution}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {edu.graduationYear || `${edu.startDate} - ${edu.endDate || "Present"}`}
                      </p>
                      {edu.description && (
                        <p className="text-gray-700 text-sm">{edu.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">Educational background will be displayed here</div>
                )}
              </div>
            </section>

            {/* Projects and Certifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certifications Section */}
              <section>
                <h2 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
                  Certifications
                </h2>
                <div className="space-y-3">
                  {data.certifications && data.certifications.length > 0 ? (
                    data.certifications.map((cert, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <h3 className="text-sm font-bold text-gray-800">
                          {cert.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {cert.issuingOrganization || cert.issuer} | {cert.year || cert.issueDate}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">Certifications will be displayed here</div>
                  )}
                </div>
              </section>

              {/* Projects Section */}
              <section>
                <h2 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3">
                  Projects
                </h2>
                <div className="space-y-3">
                  {data.projects && data.projects.length > 0 ? (
                    data.projects.map((project, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <h3 className="text-sm font-bold text-gray-800">
                          {project.title}
                        </h3>
                        <p className="text-gray-700 text-xs mb-2">{project.description}</p>
                        {(project.githubLink || project.link) && (
                          <a
                            href={project.githubLink || project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View Project
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">Projects will be displayed here</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate; 