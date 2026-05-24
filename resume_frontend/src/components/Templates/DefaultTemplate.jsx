import { FaGithub, FaLinkedin, FaPhone, FaEnvelope } from "react-icons/fa";

const DefaultTemplate = ({ data }) => {
  return (
    <div className="p-8 bg-white text-gray-900 space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-3 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">
          {data.personalInformation.fullName}
        </h1>
        <p className="text-base text-gray-600">
          {data.personalInformation.location}
        </p>

        <div className="flex justify-center space-x-6 text-sm">
          {data.personalInformation.email && (
            <a
              href={`mailto:${data.personalInformation.email}`}
              className="flex items-center text-gray-700 hover:text-blue-600"
            >
              <FaEnvelope className="mr-2" /> {data.personalInformation.email}
            </a>
          )}
          {data.personalInformation.phoneNumber && (
            <p className="flex items-center text-gray-700">
              <FaPhone className="mr-2" /> {data.personalInformation.phoneNumber}
            </p>
          )}
        </div>

        <div className="flex justify-center space-x-6 text-sm">
          {data.personalInformation.gitHub && (
            <a
              href={data.personalInformation.gitHub}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-blue-600 flex items-center"
            >
              <FaGithub className="mr-2" /> GitHub
            </a>
          )}
          {data.personalInformation.linkedIn && (
            <a
              href={data.personalInformation.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <FaLinkedin className="mr-2" /> LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Summary</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          {data.summary || "Professional summary will be displayed here."}
        </p>
      </section>

      {/* Skills Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {data.skills && data.skills.length > 0 ? (
            data.skills.map((skill, index) => (
              <div
                key={index}
                className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm"
              >
                {skill.title} - {skill.level}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm col-span-full">
              Skills will be displayed here
            </div>
          )}
        </div>
      </section>

      {/* Experience Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Experience</h2>
        {data.experience && data.experience.length > 0 ? (
          <div className="space-y-4">
            {data.experience.map((exp, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {exp.title} | {exp.company}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {exp.startDate} - {exp.endDate || "Present"}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm">
            Professional experience will be displayed here
          </div>
        )}
      </section>

      {/* Education Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Education</h2>
        {data.education && data.education.length > 0 ? (
          <div className="space-y-4">
            {data.education.map((edu, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {edu.degree} | {edu.institution}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {edu.startDate} - {edu.endDate || "Present"}
                  </span>
                </div>
                {edu.description && (
                  <p className="text-gray-700 text-sm">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm">
            Educational background will be displayed here
          </div>
        )}
      </section>

      {/* Bottom Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Certifications Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Certifications</h2>
          {data.certifications && data.certifications.length > 0 ? (
            <div className="space-y-3">
              {data.certifications.map((cert, index) => (
                <div key={index} className="text-sm">
                  <h3 className="font-medium text-gray-900">
                    {cert.title}
                  </h3>
                  <p className="text-gray-600 text-xs">
                    {cert.issuer} | {cert.issueDate}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Certifications will be displayed here
            </div>
          )}
        </section>

        {/* Projects Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Projects</h2>
          {data.projects && data.projects.length > 0 ? (
            <div className="space-y-3">
              {data.projects.map((project, index) => (
                <div key={index} className="text-sm">
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  <p className="text-gray-700 text-xs">{project.description}</p>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Projects will be displayed here
            </div>
          )}
        </section>

        {/* Languages Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Languages</h2>
          {data.languages && data.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                >
                  {lang.language} - {lang.proficiency}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Languages will be displayed here
            </div>
          )}
        </section>

        {/* Interests Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Interests</h2>
          {data.interests && data.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.interests.map((interest, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                >
                  {interest.interest}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Interests will be displayed here
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DefaultTemplate; 