// ============================================
// src/utils/constants.js
// ============================================
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const MOCK_JOBS = [
  {
    id: 1,
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120k - $180k',
    type: 'Full-time',
    posted: '2 days ago',
    description: 'We are seeking an experienced Full Stack Developer proficient in React and Django...',
    requirements: ['5+ years experience', 'React & Django', 'REST APIs', 'PostgreSQL']
  },
  {
    id: 2,
    title: 'AI/ML Engineer',
    company: 'DataMinds',
    location: 'Remote',
    salary: '$130k - $200k',
    type: 'Full-time',
    posted: '1 week ago',
    description: 'Join our AI team to build cutting-edge machine learning solutions...',
    requirements: ['Python', 'TensorFlow/PyTorch', 'NLP', 'Hugging Face']
  },
  {
    id: 3,
    title: 'Frontend Developer',
    company: 'DesignHub',
    location: 'New York, NY',
    salary: '$90k - $140k',
    type: 'Full-time',
    posted: '3 days ago',
    description: 'Create beautiful, responsive user interfaces with modern technologies...',
    requirements: ['React/Vue', 'TailwindCSS', 'TypeScript', 'UI/UX sensibility']
  },
  {
    id: 4,
    title: 'DevOps Engineer',
    company: 'CloudScale',
    location: 'Austin, TX',
    salary: '$110k - $160k',
    type: 'Contract',
    posted: '5 days ago',
    description: 'Build and maintain scalable cloud infrastructure...',
    requirements: ['AWS/Azure', 'Docker/Kubernetes', 'CI/CD', 'Linux']
  },
  {
    id: 5,
    title: 'Product Manager',
    company: 'InnovateLabs',
    location: 'Boston, MA',
    salary: '$100k - $150k',
    type: 'Full-time',
    posted: '1 day ago',
    description: 'Lead product strategy and execution for our flagship products...',
    requirements: ['Product Strategy', 'Agile', 'Data Analysis', 'Stakeholder Management']
  }
];