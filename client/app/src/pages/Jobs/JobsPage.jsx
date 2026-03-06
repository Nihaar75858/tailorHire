// ============================================
// src/pages/JobsPage.jsx
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JobSearch from "../../components/jobs/JobSearch";
import JobList from "../../components/jobs/JobList";
import ApplicationModal from "../../components/applications/ApplicationModal";
import { useJobs } from "../../components/hooks/useJobs";
import api from "../../services/api";

const JobsPage = () => {
  const navigate = useNavigate();

  const { jobs, loading, error, markJobAsApplied, appliedJobCount } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredJobs(filtered);
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

      // Mark job as applied - this removes it from the list immediately
      markJobAsApplied(selectedJob.id);

      alert(
        `Successfully applied to ${selectedJob.title} at ${selectedJob.company}!`,
      );
      setShowApplicationModal(false);
      setSelectedJob(null);
    } catch (err) {
      alert("Application failed: " + err.message);
    }
  };

  const handleSave = async (job) => {
    try {
      await api.saveJob(job.id);
      alert(`Saved ${job.title}`);
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600">
      <div className="text-white">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            Find Your Next Opportunity
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <p>
            Browse {jobs.length} available jobs
            {appliedJobCount > 0 &&
              ` · ${appliedJobCount} applications submitted`}
          </p>
          {/* Link to Applications Page */}
          {appliedJobCount > 0 && (
            <button
              onClick={() => navigate("/applications")}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
            >
              View My Applications ({appliedJobCount})
            </button>
          )}
        </div>
      </div>

      <JobSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      <JobList
        jobs={filteredJobs}
        onApply={handleApply}
        onSave={handleSave}
        loading={loading}
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
