// ============================================
// src/pages/JobsPage.jsx
// ============================================
import React, { useState, useEffect } from "react";
import JobSearch from "../../components/jobs/JobSearch";
import JobList from "../../components/jobs/JobList";
import { useJobs } from "../../components/hooks/useJobs";
import api from "../../services/api";

const JobsPage = () => {
  const { jobs, loading, error } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
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

    // const filtered = jobs.filter(
    //   (job) =>
    //     job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //     job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //     job.location.toLowerCase().includes(searchQuery.toLowerCase())
    // );
    // setFilteredJobs(filtered);
  };

  const handleApply = async (job) => {
    try {
      await api.applyToJob(job.id, {
        cover_letter: "I am interested in this position...",
      });
      alert(`Applied to ${job.title} at ${job.company}`);
    } catch (err) {
      alert("Application failed: " + err.message);
    }
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
    </div>
  );
};

export default JobsPage;
