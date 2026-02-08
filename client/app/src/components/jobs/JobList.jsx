// ============================================
// src/components/jobs/JobList.jsx
// ============================================
import React from 'react';
import JobCard from '../jobs/JobCard';

const JobList = ({ jobs, onApply, onSave }) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No jobs found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onApply={onApply} onSave={onSave} />
      ))}
    </div>
  );
};

export default JobList;