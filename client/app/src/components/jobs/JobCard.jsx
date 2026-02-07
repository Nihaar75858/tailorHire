// ============================================
// src/components/jobs/JobCard.jsx
// ============================================
import React from 'react';
import { MapPin, DollarSign, Calendar, Briefcase } from 'lucide-react';

const JobCard = ({ job, onApply, onSave }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
          <p className="text-indigo-600 font-medium">{job.company}</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {job.type}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <MapPin size={16} />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center space-x-1">
          <DollarSign size={16} />
          <span>{job.salary}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar size={16} />
          <span>{job.posted}</span>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{job.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.requirements.map((req, idx) => (
          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {req}
          </span>
        ))}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => onApply(job)}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Apply Now
        </button>
        <button
          onClick={() => onSave(job)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default JobCard;