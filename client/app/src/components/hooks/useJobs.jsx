import { useState, useEffect } from 'react';
import api from '../../services/api';

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobsAndApplications = async () => {
      try {
        // Fetch jobs
        const jobsData = await api.getJobs();
        setJobs(jobsData.results || jobsData);

        // Fetch user's applications to know which jobs are already applied
        const applicationsData = await api.getApplications();
        const applications = applicationsData.results || applicationsData;
        
        // Create Set of applied job IDs for O(1) lookup
        const appliedIds = new Set(applications.map(app => app.job));
        setAppliedJobIds(appliedIds);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchJobsAndApplications();
  }, []);

  // Helper function to check if job is applied
  const isJobApplied = (jobId) => {
    return appliedJobIds.has(jobId);
  };

  // Function to mark job as applied after successful application
  const markJobAsApplied = (jobId) => {
    setAppliedJobIds(prev => new Set([...prev, jobId]));
  };

  return { jobs, loading, error, isJobApplied, markJobAsApplied, appliedJobIds };
};
