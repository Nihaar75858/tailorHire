// ============================================
// src/pages/CoverLetterPage.jsx
// ============================================
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useUser } from '../../components/hooks/useAuth';

const CoverLetterPage = () => {
  const { user } = useUser();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }

    setLoading(true);

    // Simulate AI generation
    setTimeout(() => {
      const skills = user?.skills?.split(',')[0] || 'software development';
      const name = user?.first_name || user?.username || 'Applicant';

      const letter = `Dear Hiring Manager,

I am writing to express my strong interest in the position at your esteemed organization. With my background in ${skills} and proven track record in software development, I am confident I would be a valuable addition to your team.

Throughout my career, I have successfully delivered high-quality solutions that align with business objectives. My experience with ${user?.skills?.split(',').slice(0, 3).join(', ') || 'various technologies'} has equipped me with the technical expertise necessary to excel in this role.

I am particularly drawn to this opportunity because it aligns perfectly with my passion for building innovative solutions. I am excited about the prospect of contributing to your team's success and would welcome the opportunity to discuss how my skills and experience can benefit your organization.

Thank you for considering my application. I look forward to the opportunity to speak with you further.

Sincerely,
${name}`;

      setGeneratedLetter(letter);
      setLoading(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    alert('Cover letter copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          AI Cover Letter Generator
        </h2>
        <p className="text-gray-600">
          Generate personalized cover letters based on your profile and job description
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Resume (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer">
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={6}
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      </div>

      {generatedLetter && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Generated Cover Letter</h3>
            <button
              onClick={handleCopy}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {generatedLetter}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetterPage;