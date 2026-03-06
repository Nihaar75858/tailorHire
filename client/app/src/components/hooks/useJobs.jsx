import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";

export const useJobs = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobsAndApplications = async () => {
      try {
        // Fetch jobs
        const jobsData = await api.getJobs();
        setAllJobs(jobsData.results || jobsData);

        // Fetch user's applications to know which jobs are already applied
        const applicationsData = await api.getApplications();
        const applications = applicationsData.results || applicationsData;

        // Create Set of applied job IDs for O(1) lookup
        const appliedIds = new Set(applications.map((app) => app.job));
        setAppliedJobIds(appliedIds);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchJobsAndApplications();
  }, []);

  // Return only jobs that haven't been applied to
  // (New) Memoize this to prevent re-creating on every render
  const availableJobs = useMemo(
    () => allJobs.filter(job => !appliedJobIds.has(job.id)),
    [allJobs, appliedJobIds]
  );

  // Function to mark job as applied (removes from available jobs)
  // (New) Use useCallback to prevent re-creating function
  const markJobAsApplied = useCallback((jobId) => {
    setAppliedJobIds(prev => new Set([...prev, jobId]));
  }, []);

  return {
    jobs: availableJobs, // Only unapplied jobs
    allJobs,
    loading,
    error,
    markJobAsApplied,
    appliedJobCount: appliedJobIds.size,
  };
};
