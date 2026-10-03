import { useState, useEffect } from 'react';
import {
  fetchAboutPageData,
  transformAboutData,
  transformEducation,
  transformWorkExperience,
  transformProjects,
  transformSkills
} from '../services/cmsService';
import { normalizeDashes } from '../utils/richTextConverter';

// Apply the house dash style to every string in the About data (CMS text can contain em dashes)
const normalizeDashesDeep = (value) => {
  if (typeof value === 'string') return normalizeDashes(value);
  if (Array.isArray(value)) return value.map(normalizeDashesDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalizeDashesDeep(v)]));
  }
  return value;
};

// Fallback data for error scenarios
const FALLBACK_ABOUT_DATA = {
  about: {
    name: 'Pradhyuman Yadav',
    currentRole: '',
    tagline: '',
    location: 'Location not available',
    phone: '',
    email: '',
    bio: 'Unable to load bio from Squidex. Using fallback data.',
    socialLinks: [],
    profileImage: null,
    resumeFile: null
  },
  education: [
    {
      degree: 'Bachelor of Technology',
      fieldOfStudy: 'Information Technology',
      institution: 'VIT University',
      institutionLogo: null,
      location: 'Vellore, India',
      startDate: '',
      endDate: 'May 2021',
      gpa: '3.8',
      achievements: [],
      relevantCoursework: ['Web Development', 'Software Engineering']
    }
  ],
  experience: [
    {
      role: 'Software Developer',
      company: 'Tech Company',
      companyLogo: null,
      employmentType: 'Full-time',
      period: 'Jan 2021 - Present',
      location: 'Bangalore, India',
      description: 'Developing web applications and maintaining cloud infrastructure',
      achievements: [
        'Built responsive React applications',
        'Improved application performance by 40%'
      ],
      technologies: ['React', 'Node.js'],
      isCurrent: true
    }
  ],
  projects: [
    {
      title: 'Portfolio Website',
      slug: 'portfolio-website',
      shortDescription: 'Modern personal portfolio',
      fullDescription: 'Modern personal portfolio with Squidex CMS integration',
      thumbnail: null,
      images: [],
      projectUrl: '#',
      githubUrl: '#',
      technologies: ['React', 'Vite', 'Squidex'],
      highlights: [],
      startDate: '',
      endDate: 'November 2024',
      isFeatured: false,
      category: ''
    }
  ],
  skills: {
    Frontend: [
      { name: 'React', category: 'Frontend', proficiencyLevel: 'Advanced', yearsOfExperience: 2, displayOrder: 0, isHighlighted: false },
      { name: 'JavaScript', category: 'Frontend', proficiencyLevel: 'Advanced', yearsOfExperience: 3, displayOrder: 1, isHighlighted: false },
      { name: 'CSS', category: 'Frontend', proficiencyLevel: 'Advanced', yearsOfExperience: 3, displayOrder: 2, isHighlighted: false }
    ],
    Backend: [
      { name: 'Node.js', category: 'Backend', proficiencyLevel: 'Advanced', yearsOfExperience: 2, displayOrder: 0, isHighlighted: false },
      { name: 'Express', category: 'Backend', proficiencyLevel: 'Intermediate', yearsOfExperience: 2, displayOrder: 1, isHighlighted: false },
      { name: 'MongoDB', category: 'Backend', proficiencyLevel: 'Intermediate', yearsOfExperience: 2, displayOrder: 2, isHighlighted: false }
    ]
  }
};

/**
 * Custom hook for fetching and managing About page data
 * Fetches data from multiple Squidex schemas and transforms them
 * @returns {Object} About page data with loading and error states
 */
export const useAboutPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAboutData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all About page data from Squidex
        const rawData = await fetchAboutPageData();

        // Transform the data
        const transformedData = {
          about: transformAboutData(rawData.about && rawData.about.length > 0 ? rawData.about[0] : null),
          education: transformEducation(rawData.education),
          experience: transformWorkExperience(rawData.workexperience),
          projects: transformProjects(rawData.projects),
          skills: transformSkills(rawData.skills)
        };

        // Validate that we have at least some data
        const hasData =
          transformedData.education.length > 0 ||
          transformedData.experience.length > 0 ||
          transformedData.projects.length > 0 ||
          transformedData.skills.length > 0;

        if (hasData) {
          setData(normalizeDashesDeep(transformedData));
        } else {
          // Use fallback if all schemas returned empty
          console.warn('All Squidex schemas returned empty data. Using fallback.');
          setData(FALLBACK_ABOUT_DATA);
          setError('Note: Using fallback data. No content found in Squidex schemas.');
        }
      } catch (err) {
        console.error('Error loading about page data:', err);
        setError(`Failed to load about page data: ${err.message}`);

        // Use fallback data on error
        setData(FALLBACK_ABOUT_DATA);
      } finally {
        setLoading(false);
      }
    };

    loadAboutData();
  }, []);

  return {
    data: data || FALLBACK_ABOUT_DATA,
    loading,
    error
  };
};

export default useAboutPage;
