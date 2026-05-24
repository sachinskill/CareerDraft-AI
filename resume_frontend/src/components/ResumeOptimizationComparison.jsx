import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaTrophy } from 'react-icons/fa';

const ResumeOptimizationComparison = ({
  originalScore,
  optimizedScore,
  originalResume,
  optimizedResume,
  onAccept,
  onCancel
}) => {
  const scoreIncrease = optimizedScore - originalScore;
  const scoreColor = scoreIncrease > 0 ? 'text-success' : scoreIncrease < 0 ? 'text-error' : 'text-base-content';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="card bg-base-100 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <FaTrophy className="text-6xl text-warning mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold mb-2">
              🔥 Resume Optimized for This Job!
            </h2>
            <p className="text-lg text-base-content/70 mb-4">
              Your resume has been tailored specifically for this job description
            </p>
            
            {/* Score Delta */}
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <span className="text-error">Current Score: {originalScore}</span>
              <FaArrowRight className="text-primary" />
              <span className="text-success">New Score: {optimizedScore}</span>
            </div>
            <div className={`text-3xl font-bold mt-2 ${scoreColor}`}>
              {scoreIncrease > 0 && '+'}{scoreIncrease} points improvement
            </div>
            <p className="text-sm text-base-content/60 mt-2">
              Optimized specifically for this job description
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Before */}
            <div className="card bg-base-200 border-2 border-error/30">
              <div className="card-body">
                <h3 className="card-title text-error mb-4">
                  Before Optimization
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Name:</span> {originalResume?.personalInformation?.fullName || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Summary:</span>
                    <p className="text-base-content/70 line-clamp-3">
                      {originalResume?.summary || 'No summary'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {originalResume?.skills?.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="badge badge-sm">
                          {skill.title || skill}
                        </span>
                      ))}
                      {originalResume?.skills?.length > 5 && (
                        <span className="badge badge-sm">+{originalResume.skills.length - 5} more</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Experience:</span> {originalResume?.experience?.length || 0} entries
                  </div>
                  <div>
                    <span className="font-semibold">Education:</span> {originalResume?.education?.length || 0} entries
                  </div>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="card bg-base-200 border-2 border-success/50 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-success mb-4">
                  After Optimization ✨
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Name:</span> {optimizedResume?.personalInformation?.fullName || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Summary:</span>
                    <p className="text-base-content/70 line-clamp-3">
                      {optimizedResume?.summary || 'No summary'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {optimizedResume?.skills?.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="badge badge-success badge-sm">
                          {skill.title || skill}
                        </span>
                      ))}
                      {optimizedResume?.skills?.length > 5 && (
                        <span className="badge badge-success badge-sm">+{optimizedResume.skills.length - 5} more</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Experience:</span> {optimizedResume?.experience?.length || 0} entries
                  </div>
                  <div>
                    <span className="font-semibold">Education:</span> {optimizedResume?.education?.length || 0} entries
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onAccept}
              className="btn btn-success btn-lg gap-2"
            >
              <FaCheckCircle />
              Use Optimized Resume
            </button>
            <button
              onClick={onCancel}
              className="btn btn-outline btn-lg gap-2"
            >
              <FaTimesCircle />
              Keep Original
            </button>
          </div>

          <p className="text-center text-sm text-base-content/60 mt-4">
            The optimized version is tailored to match the job requirements and improve your ATS score
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizationComparison;
