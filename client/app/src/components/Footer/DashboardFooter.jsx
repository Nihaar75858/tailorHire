import { FaFacebook, FaSquareXTwitter, FaGithub } from "react-icons/fa6";

const sections = {
  Solutions: ["Marketing", "Analytics", "Automation", "Commerce", "Insights"],
  Support: ["Submit ticket", "Documentation", "Guides"],
  Company: ["About", "Blog", "Jobs", "Press"],
  Legal: ["Terms of service", "Privacy policy", "License"]
};

export default function DashboardFooter() {
  return (
    <footer className="bg-black text-gray-400 px-6 py-12 mt-12">
      <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Logo & Tagline */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>

          <p>
            You're Job-searching begins from here
          </p>
          <div className="flex space-x-4 pt-2 text-lg cursor-pointer">
            <FaFacebook data-testid="facebook-icon"/>
            <FaSquareXTwitter />
            <FaGithub data-testid="github-icon"/>
          </div>
        </div>

        {/* Dynamic sections */}
        {Object.entries(sections).map(([title, links]) => (
          <div key={title}>
            <h3 className="text-white font-semibold mb-3">{title}</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-700 mt-12 pt-6 text-center text-sm">
        © {new Date().getFullYear()} TailorHire, Inc. All rights reserved.
      </div>
    </footer>
  );
}
