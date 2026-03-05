// src/pages/ApplicationsPage.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Briefcase, FileText, Calendar, Building } from 'lucide-react';
import api from '../../services/api';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications();
      setApplications(data.results || data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied':
        return <CheckCircle className="text-lime-500" size={20} />;
      case 'reviewing':
        return <Clock className="text-yellow-500" size={20} />;
      case 'interview':
        return <AlertCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      case 'accepted':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'bg-lime-100 text-lime-700 border-lime-200';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'interview':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'applied': 'Application Submitted',
      'reviewing': 'Under Review',
      'interview': 'Interview Scheduled',
      'rejected': 'Not Selected',
      'accepted': 'Offer Received'
    };
    return statusMap[status] || status;
  };

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const statusCounts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    interview: applications.filter(a => a.status === 'interview').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
  };

  const handleViewCoverLetter = (application) => {
    setSelectedApplication(application);
    setShowCoverLetter(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Applications</h2>
          <p className="text-white">
            Track your job applications and their status · {applications.length} total applications
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border-5 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
            </div>
            <Briefcase className="text-gray-400" size={32} />
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg border-5 border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Applied</p>
              <p className="text-2xl font-bold text-orange-700">{statusCounts.applied}</p>
            </div>
            <CheckCircle className="text-orange-400" size={32} />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg border-5 border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Reviewing</p>
              <p className="text-2xl font-bold text-yellow-700">{statusCounts.reviewing}</p>
            </div>
            <Clock className="text-yellow-400" size={32} />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg border-5 border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Interview</p>
              <p className="text-2xl font-bold text-green-700">{statusCounts.interview}</p>
            </div>
            <AlertCircle className="text-green-400" size={32} />
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg border-5 border-emerald-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600">Offers</p>
              <p className="text-2xl font-bold text-emerald-700">{statusCounts.accepted}</p>
            </div>
            <CheckCircle className="text-emerald-400" size={32} />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'applied', 'reviewing', 'interview', 'rejected', 'accepted'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === status
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : getStatusText(status)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">
            {filter === 'all' 
              ? "You haven't applied to any jobs yet" 
              : `No applications with status: ${getStatusText(filter)}`}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Start applying to jobs from the "Find Jobs" page
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div 
              key={app.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {app.job_details?.title || 'Job Title'}
                    </h3>
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)}
                      <span>{getStatusText(app.status)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1 text-cyan-600">
                      <Building size={16} />
                      <span>{app.job_details?.company || 'Company'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              {app.job_details && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    {app.job_details.description?.substring(0, 200)}...
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {app.job_details.requirements?.map((req, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded text-xs">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="grid md:grid-cols-2 gap-5 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Applied:</span>{' '}
                    <span className="text-gray-600">
                      {new Date(app.applied_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>{' '}
                    <span className="text-gray-600">
                      {new Date(app.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                {app.cover_letter && (
                  <button
                    onClick={() => handleViewCoverLetter(app)}
                    className="flex items-center space-x-2 px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <FileText size={18} />
                    <span>View Cover Letter</span>
                  </button>
                )}
                {app.resume && (
                  <button
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={18} />
                    <span>View Resume</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cover Letter Modal */}
      {showCoverLetter && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Cover Letter</h3>
                <p className="text-gray-600 mt-1">
                  {selectedApplication.job_details?.title} at {selectedApplication.job_details?.company}
                </p>
              </div>
              <button
                onClick={() => setShowCoverLetter(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {selectedApplication.cover_letter}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => navigator.clipboard.writeText(selectedApplication.cover_letter)}
                className="px-4 py-2 border border-orange-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowCoverLetter(false)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;