// ============================================
// src/pages/JobsPage.jsx
// ============================================
import React, { useState } from 'react';
import JobSearch from '../../components/jobs/JobSearch';
import JobList from '../../components/jobs/JobList';
import { useJobs } from '../../components/hooks/useJobs';

const JobsPage = () => {
  const { jobs, loading, error } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);

  React.useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredJobs(filtered);
  };

  const handleApply = (job) => {
    alert(`Applying to ${job.title} at ${job.company}`);
    // In production: navigate to application page or open modal
  };

  const handleSave = (job) => {
    alert(`Saved ${job.title}`);
    // In production: call API to save job
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading jobs: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Find Your Next Opportunity
        </h2>
        <p className="text-gray-600">Browse thousands of jobs tailored to your skills</p>
      </div>

      <JobSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      <JobList jobs={filteredJobs} onApply={handleApply} onSave={handleSave} />
    </div>
  );
};

export default JobsPage;