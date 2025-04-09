import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication services
export const authServices = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Login failed');
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Registration failed');
    }
  },
  getUsers: async () => {
    try {
      const response = await api.get('/user-roles');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch users');
    }
  },
  updateUserRole: async (userId, accessType) => {
    try {
      const response = await api.post('/user-roles', { user_id: userId, access_type: accessType });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update user role');
    }
  },
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update user');
    }
  }
};

// Question services
export const questionServices = {
  getAllQuestions: async () => {
    try {
      const response = await api.get('/questions');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch questions');
    }
  },
  
  getQuestionById: async (id) => {
    try {
      const response = await api.get(`/questions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch question');
    }
  },
  
  createQuestion: async (questionData) => {
    try {
      // console.log("Request URL:", api.defaults.baseURL + '/questions/add');
      // console.log("Request headers:", api.defaults.headers);
      
      // Get token from localStorage and log it
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log("Auth token available:", !!user.token);
      
      const response = await api.post('/questions/add', questionData);
      // console.log("Response received:", response.status);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        throw error.response.data;
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error('No response from server. Please check your connection.');
      }
      throw new Error('Failed to create question: ' + error.message);
    }
  },
  
  updateQuestion: async (id, questionData) => {
    try {
      const response = await api.put(`/questions/${id}`, questionData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update question');
    }
  },
  
  deleteQuestion: async (id) => {
    try {
      const response = await api.delete(`/questions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to delete question');
    }
  }
};

// Template services
export const templateServices = {
  getAllTemplates: async () => {
    try {
      const response = await api.get('/templates');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch templates');
    }
  },
  
  getTemplateById: async (id) => {
    try {
      const response = await api.get(`/templates/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch template');
    }
  },
  
  createTemplate: async (templateData) => {
    try {
      const response = await api.post('/templates', templateData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      }
      throw new Error('Failed to create template: ' + error.message);
    }
  },
  
  updateTemplate: async (id, templateData) => {
    try {
      const response = await api.put(`/templates/${id}`, templateData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update template');
    }
  },
  
  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/templates/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to delete template');
    }
  },
  
  getTemplateQuestions: async (id) => {
    try {
      const response = await api.get(`/templates/${id}/questions`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch template questions');
    }
  },
  
  addQuestionsToTemplate: async (id, questions) => {
    try {
      const response = await api.post(`/templates/${id}/questions`, { questions });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to add questions to template');
    }
  },
  
  removeQuestionFromTemplate: async (templateId, questionId) => {
    try {
      const response = await api.delete(`/templates/${templateId}/questions/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to remove question from template');
    }
  }
};

// Audit services
export const auditServices = {
  getAuditLogs: async (params = {}) => {
    try {
      // Convert params to URL query parameters
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      const query = queryParams.toString();
      const url = `/audit${query ? `?${query}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch audit logs');
    }
  },
  
  getAuditLog: async (id) => {
    try {
      const response = await api.get(`/audit/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch audit log');
    }
  },
  
  createAuditLog: async (auditData) => {
    try {
      const response = await api.post('/audit', auditData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create audit log');
    }
  }
};

export default {
  auth: authServices,
  questions: questionServices,
  templates: templateServices
}; 