// src/pages/CoverLetterPage.jsx
import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { useUser } from "../../components/hooks/useAuth";
import api from "../../services/api";

const CoverLetterPage = () => {
  const { user } = useUser();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AI Cover Letter generation
  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      alert("Please enter a job description");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call backend API with AI integration
      const data = await api.generateCoverLetter({
        job_description: jobDescription,
        resume_text: resumeText, // Optional
      });

      // Backend returns: { id, generated_letter, job_description, created_at, ... }
      setGeneratedLetter(data.generated_letter);
    } catch (err) {
      console.error("Cover letter generation failed:", err);
      setError(err.message || "Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    alert("Cover letter copied to clipboard!");
  };

  // Load previous cover letters (Optional)
  const [previousLetters, setPreviousLetters] = useState([]);

  useEffect(() => {
    const loadPreviousLetters = async () => {
      try {
        const data = await api.getCoverLetters();
        setPreviousLetters(data.results || data);
      } catch (err) {
        console.error("Failed to load previous letters:", err);
      }
    };

    loadPreviousLetters();
  }, []);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          AI Cover Letter Generator
        </h2>
        <p className="text-white">
          Generate personalized cover letters using AI based on your profile
        </p>
      </div>

      {error && (
        <div className="bg-red-50 font-bold border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Resume (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-stone-900 transition-colors cursor-pointer">
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 mt-1">
              PDF, DOC, DOCX (Max 5MB)
            </p>
          </div>
        </div>

        {/* Optional resume text input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Paste Resume Text (Optional)
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            rows={4}
            placeholder="Paste key highlights from your resume..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            rows={6}
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-6 py-3 bg-neutral-600 text-white rounded-lg hover:bg-stone-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating with AI..." : "Generate Cover Letter"}
        </button>

        {loading && (
          <div className="text-center text-sm text-gray-600">
            <p>AI is analyzing your profile and the job description...</p>
            <p className="text-xs mt-1">This may take 10-30 seconds</p>
          </div>
        )}
      </div>

      {generatedLetter && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Generated Cover Letter
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setGeneratedLetter("")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {generatedLetter}
            </pre>
          </div>
        </div>
      )}

      {/* Show previous cover letters */}
      {previousLetters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Previous Cover Letters
          </h3>
          <div className="space-y-3">
            {previousLetters.map((letter) => (
              <div
                key={letter.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setGeneratedLetter(letter.generated_letter)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">
                      {new Date(letter.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {letter.job_description.substring(0, 100)}...
                    </p>
                  </div>
                  <button className="text-orange-500 text-sm hover:underline">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetterPage;