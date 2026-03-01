import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../components/hooks/useAuth";
// import Recommendations from "./../../components/User/Recommendations";

const cards = [
  {
    title: "Resume & Cover Letters",
    description: "Generate AI cover letters and job match scores.",
    link: "/coverletter",
  },
  {
    title: "Job Postings",
    description: "Browse and apply for job opportunities.",
    link: "/jobs",
  },
  {
    title: "Chat with TailorHire",
    description: "Chat with our AI assistant for job search tips.",
    link: "/tailorhire",
  },
];

const UserDashBoard = () => {
  const { user } = useUser();
  if (!user) return <p>Loading...</p>;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600 flex flex-col items-center justify-center text-gray-800">
        <div className="text-7xl justify-center text-center text-white pb-6">
          Welcome, {user.username}
        </div>
        <div className="text-7xl justify-center text-center text-white pb-6">
          How can I help you today?
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {cards.map((card, idx) => (
            <Link
              key={idx}
              to={card.link}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition duration-200"
            >
              <h2 className="text-xl font-bold mb-2">{card.title}</h2>
              <p className="text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default UserDashBoard;
