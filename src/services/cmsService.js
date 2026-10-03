import { useState, useEffect } from 'react';
import {
  SQUIDEX_APP_NAME,
  SQUIDEX_CLIENT_ID,
  SQUIDEX_URL,
  getSquidexToken,
  fetchSquidexArticles,
} from './squidexClient';

export const useCMS = () => {
  const [latestArticle, setLatestArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from Squidex first
        const articles = await fetchSquidexArticles();
        
        if (articles.length > 0) {
          // Get the latest article (first in the list)
          const article = articles[0];
          
          // Helper function to convert Squidex rich text JSON to HTML
          const convertRichTextToHTML = (contentObj) => {
            if (typeof contentObj === 'string') return contentObj;
            if (!contentObj || typeof contentObj !== 'object') return '';
            
            // Handle nested structure
            if (contentObj.iv) {
              return convertRichTextToHTML(contentObj.iv);
            }
            
            // Handle rich text document structure
            if (contentObj.type === 'doc' && contentObj.content) {
              return contentObj.content.map(convertNodeToHTML).join('');
            }
            
            return '';
          };
          
          // Convert individual nodes to HTML
          const convertNodeToHTML = (node) => {
            if (!node || !node.type) return '';
            
            switch (node.type) {
              case 'paragraph':
                const paragraphContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<p>${paragraphContent}</p>`;
                
              case 'text':
                let text = node.text || '';
                if (node.marks) {
                  node.marks.forEach(mark => {
                    switch (mark.type) {
                      case 'bold':
                        text = `<strong>${text}</strong>`;
                        break;
                      case 'italic':
                        text = `<em>${text}</em>`;
                        break;
                      case 'underline':
                        text = `<u>${text}</u>`;
                        break;
                      case 'code':
                        text = `<code>${text}</code>`;
                        break;
                      case 'link':
                        text = `<a href="${mark.attrs?.href || '#'}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                        break;
                    }
                  });
                }
                return text;
                
              case 'bulletList':
                const listItems = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<ul>${listItems}</ul>`;
                
              case 'orderedList':
                const orderedItems = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<ol>${orderedItems}</ol>`;
                
              case 'listItem':
                const itemContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<li>${itemContent}</li>`;
                
              case 'heading':
                const headingContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                const level = node.attrs?.level || 1;
                return `<h${level}>${headingContent}</h${level}>`;
                
              case 'image':
                const imageSrc = node.attrs?.src || '';
                const imageAlt = node.attrs?.alt || '';
                const imageTitle = node.attrs?.title || '';
                const imageAlign = node.attrs?.align || 'center';
                
                let imageStyle = 'max-width: 100%; height: auto; margin: 2rem auto; display: block;';
                
                if (imageAlign === 'left') {
                  imageStyle = 'max-width: 50%; height: auto; margin: 0 1.5rem 1rem 0; float: left;';
                } else if (imageAlign === 'right') {
                  imageStyle = 'max-width: 50%; height: auto; margin: 0 0 1rem 1.5rem; float: right;';
                }
                
                return `<img src="${imageSrc}" alt="${imageAlt}" title="${imageTitle}" style="${imageStyle}" />`;
                
              case 'hardBreak':
                return '<br>';
                
              case 'codeBlock':
                const codeContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                const language = node.attrs?.language || '';
                return `<pre><code class="language-${language}">${codeContent}</code></pre>`;
                
              case 'blockquote':
                const quoteContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<blockquote>${quoteContent}</blockquote>`;
                
              case 'horizontalRule':
                return '<hr>';
                
              case 'table':
                const tableContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">${tableContent}</table>`;
                
              case 'tableRow':
                const rowContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<tr>${rowContent}</tr>`;
                
              case 'tableCell':
                const cellContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<td style="border: 1px solid var(--border-color); padding: 0.5rem;">${cellContent}</td>`;
                
              case 'tableHeader':
                const headerContent = node.content ? node.content.map(convertNodeToHTML).join('') : '';
                return `<th style="border: 1px solid var(--border-color); padding: 0.5rem; font-weight: bold;">${headerContent}</th>`;
                
              default:
                // Handle unknown node types gracefully
                if (node.content) {
                  return node.content.map(convertNodeToHTML).join('');
                }
                return '';
            }
          };
          
          // Helper function to convert asset to URL
          const convertAssetToUrl = (assetData) => {
            if (!assetData) return null;
            if (Array.isArray(assetData)) {
              if (assetData.length === 0) return null;
              assetData = assetData[0];
            }
            if (typeof assetData === 'string' && assetData.startsWith('http')) {
              return assetData;
            }
            if (typeof assetData === 'object' && assetData?.id) {
              return `${SQUIDEX_URL}/api/assets/${SQUIDEX_APP_NAME}/${assetData.id}`;
            }
            if (typeof assetData === 'string') {
              return `${SQUIDEX_URL}/api/assets/${SQUIDEX_APP_NAME}/${assetData}`;
            }
            return null;
          };

          setLatestArticle({
            id: article.id,
            title: article.data?.title?.iv || 'Untitled',
            content: convertRichTextToHTML(article.data?.content?.iv) || 'No content available',
            excerpt: article.data?.excerpt?.iv || '',
            author: article.data?.author?.iv || 'Unknown',
            publishDate: article.data?.publishDate?.iv || article.lastModified || article.created,
            slug: article.data?.slug?.iv || '',
            tags: article.data?.tags?.iv || [],
            featuredImage: convertAssetToUrl(article.data?.featuredImage?.iv),
            status: article.data?.status?.iv || article.status || 'draft',
            created: article.created,
            lastModified: article.lastModified
          });
        } else {
          // Fallback to mock data if no articles found
          const mockArticle = {
            id: 1,
            title: "Welcome to My Dashboard",
            content: `
              <p>This is a sample article to demonstrate the dashboard functionality.</p>
              <p>Your Squidex connection is working! No articles found in the 'blog' schema.</p>
              <p>To add blog posts:</p>
              <ul>
                <li>Go to your Squidex admin panel</li>
                <li>Create blog posts in the 'blog' schema</li>
                <li>Add fields like: title, content, author</li>
                <li>Refresh this page</li>
              </ul>
              <p><strong>Squidex URL:</strong> ${SQUIDEX_URL}</p>
              <p><strong>App Name:</strong> ${SQUIDEX_APP_NAME}</p>
            `,
            publishedAt: new Date().toISOString(),
            author: "Pradhyuman"
          };
          setLatestArticle(mockArticle);
        }
      } catch (err) {
        console.error('CMS Error:', err);
        setError(`Failed to load articles: ${err.message}`);
        
        // Show mock data on error with connection info
        const mockArticle = {
          id: 1,
          title: "Squidex Connection Error",
          content: `
            <p>There was an error connecting to Squidex.</p>
            <p><strong>Error:</strong> ${err.message}</p>
            <p><strong>Squidex URL:</strong> ${SQUIDEX_URL}</p>
            <p><strong>App Name:</strong> ${SQUIDEX_APP_NAME}</p>
            <p><strong>Client ID:</strong> ${SQUIDEX_CLIENT_ID}</p>
            <p>Please check your Squidex configuration and ensure:</p>
            <ul>
              <li>The app exists in Squidex</li>
              <li>The 'blog' schema is created</li>
              <li>Client credentials are correct</li>
              <li>The API is accessible</li>
            </ul>
          `,
          publishedAt: new Date().toISOString(),
          author: "Pradhyuman"
        };
        setLatestArticle(mockArticle);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticle();
  }, []);

  return {
    latestArticle,
    loading,
    error
  };
};

// ===== About Page Data Functions =====

/**
 * Fetch data from a specific schema
 * @param {String} schemaName - Name of the schema to fetch from
 * @returns {Promise<Array>} Array of items from the schema
 */
export const fetchSchemaData = async (schemaName) => {
  try {
    const token = await getSquidexToken();
    const response = await fetch(
      `${SQUIDEX_URL}/api/content/${SQUIDEX_APP_NAME}/${schemaName}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ${schemaName}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Error fetching ${schemaName}:`, error);
    throw error;
  }
};

/**
 * Fetch all About page data from multiple schemas in parallel
 * @returns {Promise<Object>} Object with arrays for about, education, workexperience, projects, skills
 */
export const fetchAboutPageData = async () => {
  try {
    const schemas = ['about', 'education', 'workexperience', 'projects', 'skills'];

    const requests = schemas.map(schema =>
      fetchSchemaData(schema).catch(error => {
        console.error(`Error fetching ${schema}:`, error);
        return []; // Return empty array on error for individual schema
      })
    );

    const [about, education, workexperience, projects, skills] = await Promise.all(requests);

    return {
      about,
      education,
      workexperience,
      projects,
      skills
    };
  } catch (error) {
    console.error('Error fetching about page data:', error);
    throw error;
  }
};

/**
 * Format a date string to readable format
 * @param {String} dateString - ISO date string
 * @returns {String} Formatted date (e.g., "May 2025")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch (err) {
    console.error('Error formatting date:', err);
    return dateString;
  }
};

/**
 * Format a date range for display
 * @param {String} startDate - Start date ISO string
 * @param {String} endDate - End date ISO string or "Present"
 * @returns {String} Formatted date range (e.g., "July 2025 - Present")
 */
export const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = (endDate === 'Present' || !endDate) ? 'Present' : formatDate(endDate);
  return `${start} - ${end}`;
};

/**
 * Helper function to convert Squidex assets to URLs
 * @param {*} assetData - Asset data from Squidex
 * @returns {string|null} URL to the asset
 */
const convertAssetToUrl = (assetData) => {
  if (!assetData) return null;
  if (Array.isArray(assetData)) {
    if (assetData.length === 0) return null;
    assetData = assetData[0];
  }
  if (typeof assetData === 'string' && assetData.startsWith('http')) {
    return assetData;
  }
  if (typeof assetData === 'object' && assetData?.id) {
    return `${SQUIDEX_URL}/api/assets/${SQUIDEX_APP_NAME}/${assetData.id}`;
  }
  if (typeof assetData === 'string') {
    return `${SQUIDEX_URL}/api/assets/${SQUIDEX_APP_NAME}/${assetData}`;
  }
  return null;
};

/**
 * Normalize URL by adding protocol if missing
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL with protocol
 */
const normalizeUrl = (url) => {
  if (!url || url === '#') return url;
  if (typeof url !== 'string') return '#';

  // If it already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Add https:// protocol if missing
  return `https://${url}`;
};

/**
 * Transform Squidex about data to component-friendly format
 * @param {Object} squidexData - Raw Squidex about item
 * @returns {Object} Transformed about data
 */
export const transformAboutData = (squidexData) => {
  if (!squidexData || !squidexData.data) {
    return {
      name: 'Pradhyuman Yadav',
      currentRole: '',
      tagline: '',
      location: '',
      phone: '',
      email: '',
      bio: '',
      socialLinks: [],
      profileImage: null,
      resumeFile: null
    };
  }

  return {
    name: squidexData.data?.fullName?.iv || 'Pradhyuman Yadav',
    currentRole: squidexData.data?.currentRole?.iv || '',
    tagline: squidexData.data?.tagline?.iv || '',
    location: squidexData.data?.location?.iv || '',
    phone: squidexData.data?.phone?.iv || '',
    email: squidexData.data?.email?.iv || '',
    bio: squidexData.data?.bio?.iv || '',
    socialLinks: squidexData.data?.SocialLinks?.iv || [],
    profileImage: convertAssetToUrl(squidexData.data?.profileImage?.iv),
    resumeFile: convertAssetToUrl(squidexData.data?.resumeFile?.iv)
  };
};

/**
 * Transform education data from Squidex
 * @param {Array} items - Array of education items from Squidex
 * @returns {Array} Transformed education data
 */
export const transformEducation = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .sort((a, b) => (a.data?.displayOrder?.iv || 0) - (b.data?.displayOrder?.iv || 0))
    .map(item => {
      // Extract achievements - they are objects with 'achievement' property
      const achievementsArray = item.data?.achievements?.iv || [];
      const achievements = Array.isArray(achievementsArray)
        ? achievementsArray.map(a => a.achievement || a)
        : [];

      // Extract coursework - they are objects with 'course' property
      const courseworkArray = item.data?.relevantCoursework?.iv || [];
      const relevantCoursework = Array.isArray(courseworkArray)
        ? courseworkArray.map(c => c.course || c)
        : [];

      return {
        degree: item.data?.degree?.iv || '',
        fieldOfStudy: item.data?.fieldOfStudy?.iv || '',
        institution: item.data?.institution?.iv || '',
        institutionLogo: convertAssetToUrl(item.data?.institutionLogo?.iv),
        location: item.data?.location?.iv || '',
        startDate: formatDate(item.data?.startDate?.iv),
        endDate: formatDate(item.data?.endDate?.iv),
        gpa: item.data?.gpa?.iv || '',
        achievements: achievements,
        relevantCoursework: relevantCoursework
      };
    });
};

/**
 * Transform work experience data from Squidex
 * @param {Array} items - Array of work experience items from Squidex
 * @returns {Array} Transformed experience data
 */
export const transformWorkExperience = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .sort((a, b) => (a.data?.displayOrder?.iv || 0) - (b.data?.displayOrder?.iv || 0))
    .map(item => {
      const endDate = item.data?.isCurrent?.iv ? 'Present' : item.data?.endDate?.iv;

      // Extract achievements - they are objects with 'achievement' property
      const achievementsArray = item.data?.achievements?.iv || [];
      const achievements = Array.isArray(achievementsArray)
        ? achievementsArray.map(a => a.achievement || a)
        : [];

      return {
        role: item.data?.role?.iv || '',
        company: item.data?.company?.iv || '',
        companyLogo: convertAssetToUrl(item.data?.companyLogo?.iv),
        employmentType: item.data?.employmentType?.iv || 'Full-time',
        period: formatDateRange(item.data?.startDate?.iv, endDate),
        location: item.data?.location?.iv || '',
        description: item.data?.description?.iv || '',
        achievements: achievements,
        technologies: item.data?.technologies?.iv || [],
        isCurrent: item.data?.isCurrent?.iv || false
      };
    });
};

/**
 * Transform projects data from Squidex
 * @param {Array} items - Array of project items from Squidex
 * @returns {Array} Transformed projects data
 */
export const transformProjects = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .sort((a, b) => (a.data?.displayOrder?.iv || 0) - (b.data?.displayOrder?.iv || 0))
    .map(item => {
      const endDate = item.data?.endDate?.iv || item.data?.startDate?.iv;
      return {
        title: item.data?.title?.iv || '',
        slug: item.data?.slug?.iv || '',
        shortDescription: item.data?.shortDescription?.iv || '',
        fullDescription: item.data?.fullDescription?.iv || '',
        thumbnail: convertAssetToUrl(item.data?.thumbnail?.iv),
        images: (item.data?.images?.iv || []).map(convertAssetToUrl).filter(Boolean),
        projectUrl: normalizeUrl(item.data?.projectUrl?.iv) || '#',
        githubUrl: normalizeUrl(item.data?.githubUrl?.iv) || '#',
        technologies: item.data?.technologies?.iv || [],
        highlights: item.data?.highlights?.iv || [],
        startDate: formatDate(item.data?.startDate?.iv),
        endDate: formatDate(endDate),
        isFeatured: item.data?.isFeatured?.iv || false,
        category: item.data?.category?.iv || ''
      };
    });
};

/**
 * Transform skills data from Squidex
 * @param {Array} items - Array of skill items from Squidex
 * @returns {Object} Skills grouped by category
 */
export const transformSkills = (items) => {
  if (!Array.isArray(items)) return {};

  const skillsByCategory = {};

  items.forEach(item => {
    const category = item.data?.category?.iv || 'Other';
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }

    skillsByCategory[category].push({
      name: item.data?.name?.iv || '',
      category: category,
      proficiencyLevel: item.data?.proficiencyLevel?.iv || 'Intermediate',
      yearsOfExperience: item.data?.yearsOfExperience?.iv || 0,
      displayOrder: item.data?.displayOrder?.iv || 0,
      isHighlighted: item.data?.isHighlighted?.iv || false
    });
  });

  // Sort skills within each category by displayOrder
  Object.keys(skillsByCategory).forEach(category => {
    skillsByCategory[category].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  return skillsByCategory;
};

// Export for potential future use
export const cmsService = {
  async fetchArticles() {
    // Placeholder for fetching all articles
    return [];
  },

  async fetchArticleById(id) {
    // Placeholder for fetching specific article
    return null;
  },

  async fetchCategories() {
    // Placeholder for fetching categories
    return [];
  }
};

// Export the fetch function for use in other components
export { fetchSquidexArticles };
