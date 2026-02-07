import { useState, useEffect } from 'react';
import { MOCK_JOBS } from '../../utils/constants';

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setTimeout(() => {
          try {
            setJobs(MOCK_JOBS);
            setLoading(false);
          } catch (err) {
            setError(err.message);
            setLoading(false);
          }
        }, 500);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return { jobs, loading, error };
};
