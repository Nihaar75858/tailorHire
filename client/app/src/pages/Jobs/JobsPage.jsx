// ============================================
// src/pages/JobsPage.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import JobSearch from '../../components/jobs/JobSearch';
import JobList from '../../components/jobs/JobList';
import { useJobs } from '../../components/hooks/useJobs';

const JobsPage = () => {
  const { jobs, loading, error } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
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
  };

  const handleSave = (job) => {
    alert(`Saved ${job.title}`);
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
    <div className="space-y-6 p-6 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600">
      <div className='text-white'>
        <h2 className="text-3xl font-bold mb-2">
          Find Your Next Opportunity
        </h2>
        <p>Browse thousands of jobs tailored to your skills</p>
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