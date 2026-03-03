// ============================================
// src/pages/JobsPage.jsx
// ============================================
import React, { useState, useEffect } from "react";
import JobSearch from "../../components/jobs/JobSearch";
import JobList from "../../components/jobs/JobList";
import ApplicationModal from "../../components/applications/ApplicationModal";
import { useJobs } from "../../components/hooks/useJobs";
import api from "../../services/api";

const JobsPage = () => {
  const { jobs, loading, error } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    setSearching(true);
    try {
      const data = await api.getJobs({ search: searchQuery });
      setFilteredJobs(data.results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  // Open modal to select cover letter
  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  // Submit application with selected cover letter
  const handleSubmitApplication = async (applicationData) => {
    try {
      await api.applyToJob(selectedJob.id, applicationData);
      alert(`Successfully applied to ${selectedJob.title} at ${selectedJob.company}!`);
      setShowApplicationModal(false);
      setSelectedJob(null);
    } catch (err) {
      alert('Application failed: ' + err.message);
    }
  };

  const handleSave = async (job) => {
    try {
      await api.saveJob(job.id);
      alert(`Saved ${job.title}`);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading jobs...</div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-red-500">Error loading jobs: {error}</div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600">
      <div className="text-white">
        <h2 className="text-3xl font-bold mb-2">Find Your Next Opportunity</h2>
        <p>Browse thousands of jobs tailored to your skills</p>
      </div>

      <JobSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {searching && <div>Searching...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      <JobList
        jobs={filteredJobs}
        onApply={handleApply}
        onSave={handleSave}
      />

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          job={selectedJob}
          onSubmit={handleSubmitApplication}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default JobsPage;
