// src/components/jobs/ApplicationModal.jsx
import React, { useState, useEffect } from 'react';
import { X, FileText, Plus } from 'lucide-react';
import api from '../../services/api';

const ApplicationModal = ({ job, onSubmit, onClose }) => {
  const [coverLetters, setCoverLetters] = useState([]);
  const [selectedLetterId, setSelectedLetterId] = useState(null);
  const [selectedLetterText, setSelectedLetterText] = useState('');
  const [customCoverLetter, setCustomCoverLetter] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingNew, setGeneratingNew] = useState(false);

  // Fetch previously generated cover letters
  useEffect(() => {
    const fetchCoverLetters = async () => {
      try {
        const data = await api.getCoverLetters();
        setCoverLetters(data.results || data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch cover letters:', err);
        setLoading(false);
      }
    };

    fetchCoverLetters();
  }, []);

  // Generate new cover letter specifically for this job
  const handleGenerateNew = async () => {
    setGeneratingNew(true);
    try {
      const data = await api.generateCoverLetter({
        job_description: job.description,
        job: job.id  // Link to this specific job
      });

      // Add to list and select it
      setCoverLetters([data, ...coverLetters]);
      setSelectedLetterId(data.id);
      setSelectedLetterText(data.generated_letter);
      setUseCustom(false);
    } catch (err) {
      alert('Failed to generate cover letter: ' + err.message);
    } finally {
      setGeneratingNew(false);
    }
  };

  const handleSelectLetter = (letter) => {
    setSelectedLetterId(letter.id);
    setSelectedLetterText(letter.generated_letter);
    setUseCustom(false);
  };

  const handleSubmit = () => {
    const coverLetterText = useCustom ? customCoverLetter : selectedLetterText;

    if (!coverLetterText.trim()) {
      alert('Please select or write a cover letter');
      return;
    }

    onSubmit({
      cover_letter: coverLetterText,
      cover_letter_id: useCustom ? null : selectedLetterId  // Optional: track which letter was used
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply to Job</h2>
            <p className="text-gray-600 mt-1">
              {job.title} at {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Generate New Button */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Generate Cover Letter for This Job
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  AI will create a personalized cover letter based on this job description
                </p>
              </div>
              <button
                onClick={handleGenerateNew}
                disabled={generatingNew}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
                <span>{generatingNew ? 'Generating...' : 'Generate New'}</span>
              </button>
            </div>
          </div>

          {/* Cover Letter Options */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Select a Cover Letter
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading your cover letters...
              </div>
            ) : coverLetters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-2 text-gray-400" />
                <p>No cover letters found</p>
                <p className="text-sm mt-1">Generate one above to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {coverLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => handleSelectLetter(letter)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedLetterId === letter.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {letter.job_title || 'Cover Letter'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(letter.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedLetterId === letter.id && (
                        <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {letter.generated_letter.substring(0, 150)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OR Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Write Custom */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Write Custom Cover Letter</h3>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">Use custom letter</span>
              </label>
            </div>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={8}
              placeholder="Write your own cover letter here..."
              value={customCoverLetter}
              onChange={(e) => setCustomCoverLetter(e.target.value)}
              disabled={!useCustom}
            />
          </div>

          {/* Preview Selected Letter */}
          {!useCustom && selectedLetterText && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Preview</h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-64 overflow-y-auto">
                {selectedLetterText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!useCustom && !selectedLetterId}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;