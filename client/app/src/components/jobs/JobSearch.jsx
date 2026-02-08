// ============================================
// src/components/jobs/JobSearch.jsx
// ============================================
import React from 'react';
import { Search } from 'lucide-react';

const JobSearch = ({ searchQuery, onSearchChange, onSearch }) => {
  return (
    <div className="flex space-x-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search jobs, companies, or locations..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
      </div>
      <button
        onClick={onSearch}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Search
      </button>
    </div>
  );
};

export default JobSearch;