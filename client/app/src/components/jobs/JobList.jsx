// ============================================
// src/components/jobs/JobList.jsx
// ============================================
import React from "react";
import JobCard from "../jobs/JobCard";

const JobList = ({ jobs, onApply, onSave, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading jobs...</p>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No available jobs found</p>
        <p className="text-sm text-gray-500 mt-2">
          You've either applied to all matching jobs or no jobs match your
          search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onApply={onApply} onSave={onSave} />
      ))}
    </div>
  );
};

export default JobList;
