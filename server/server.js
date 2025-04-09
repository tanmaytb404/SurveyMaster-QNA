const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock user database for demo purposes
// In a real application, this would be stored in an actual database
const users = [];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in FastAPI
    const response = await axios.post(`${FASTAPI_URL}/users/`, {
      username,
      email,
      password_hash: hashedPassword
    });

    const newUser = {
      user_id: response.data.user_id,
      username,
      email
    };

    // Add to mock database
    users.push(newUser);

    // Generate JWT
    const token = jwt.sign(
      { user_id: newUser.user_id, email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      ...newUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.response?.data || error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    // Get all users from FastAPI
    const response = await axios.get(`${FASTAPI_URL}/users`);
    const allUsers = response.data;
    console.log("Users fetched:", allUsers.length);

    // Find user by email
    const user = allUsers.find(u => u.email === email);
    
    if (!user) {
      console.log("User not found, using default user for demo");
      // TEMPORARY FIX FOR DEMO: Use a hardcoded user ID if user not found
      // IMPORTANT: In production, you should return an authentication error
      const demoUser = {
        user_id: 1, // Using ID 1 as a fallback for demo
        username: "Demo User",
        email: email,
        access_type: "user" // Default role for demo user
      };
      
      // Generate JWT with demo user ID and role
      const token = jwt.sign(
        { user_id: demoUser.user_id, email: demoUser.email, access_type: demoUser.access_type },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        user_id: demoUser.user_id,
        username: demoUser.username,
        email: demoUser.email,
        access_type: demoUser.access_type,
        token
      });
    }
    
    console.log("User found:", user.user_id);
    
    // Get user's role from FastAPI
    let userRole = "user"; // Default role
    try {
      const roleResponse = await axios.get(`${FASTAPI_URL}/user-roles/${user.user_id}`);
      userRole = roleResponse.data.access_type;
    } catch (roleError) {
      console.error("Error fetching user role:", roleError);
      // Continue with default role
    }

    // Generate JWT with user ID and role
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, access_type: userRole },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      access_type: userRole,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // TEMPORARY FALLBACK FOR DEMO: If we can't connect to FastAPI, use hardcoded user
    console.log("Using fallback demo user due to error");
    const demoUser = {
      user_id: 1,
      username: "Demo User",
      email: req.body.email || "demo@example.com",
      access_type: "user" // Default role for demo user
    };
    
    // Generate JWT with demo user ID and role
    const token = jwt.sign(
      { user_id: demoUser.user_id, email: demoUser.email, access_type: demoUser.access_type },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      user_id: demoUser.user_id,
      username: demoUser.username,
      email: demoUser.email,
      access_type: demoUser.access_type,
      token
    });
  }
});

// add questions
app.post('/api/questions/add', verifyToken, async (req, res) => {
  console.log("Request body:", req.body);
  console.log("User from token:", req.user);
  
  try {
    // Make sure created_by is not null by using the user ID from the token if needed
    const questionData = { ...req.body };
    
    // Verify created_by is a number and not null
    if (!questionData.created_by || isNaN(parseInt(questionData.created_by, 10))) {
      console.log("created_by is missing or invalid, using user_id from token");
      questionData.created_by = req.user.user_id;
    }
    
    console.log("Sending question data to FastAPI:", questionData);
    
    // Forward the request to FastAPI's /questions/add endpoint
    const response = await axios.post(`${FASTAPI_URL}/questions/add`, questionData);
    console.log("Response from FastAPI:", response.status);
    
    // Return the FastAPI response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error adding question:', error);
    
    // Show the validation error details
    if (error.response && error.response.status === 422) {
      return res.status(422).json({
        message: 'Validation error',
        details: error.response.data.detail
      });
    }
    
    // Forward other errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to add question',
        error: error.response.data
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Failed to add question',
      error: error.message
    });
  }
});

// Proxy middleware options
const apiProxyOptions = {
  target: FASTAPI_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/questions': '/questions',
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
};

// API Routes for questions - proxied to FastAPI, but exclude the /add route which is handled above
app.use('/api/questions', verifyToken, (req, res, next) => {
  // Skip the proxy for /api/questions/add since we have a specific handler
  if (req.path === '/add') {
    return next('route');
  }
  return createProxyMiddleware(apiProxyOptions)(req, res, next);
});

// Debugging route to check models
app.get('/api/models', async (req, res) => {
  try {
    console.log("Fetching OpenAPI schema from FastAPI");
    const response = await axios.get(`${FASTAPI_URL}/openapi.json`);
    const schemas = response.data.components.schemas;
    console.log("OpenAPI schema fetched successfully");
    res.json({ 
      message: "This shows the expected format for adding questions",
      QuestionModelBase: schemas.QuestionModelBase
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      message: 'Failed to fetch models',
      error: error.message
    });
  }
});

// Templates routes
app.get('/api/templates', verifyToken, async (req, res) => {
  try {
    const response = await fetch(`${FASTAPI_URL}/templates`);
    
    if (!response.ok) {
      console.error(`Error fetching templates: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch templates' });
    }
    
    const templates = await response.json();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/templates', verifyToken, async (req, res) => {
  try {
    const templateData = req.body;
    
    // If no created_by is specified, use the current user's ID
    if (!templateData.created_by && req.user) {
      templateData.created_by = req.user.user_id;
    }
    
    const response = await fetch(`${FASTAPI_URL}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });
    
    if (response.status === 422) {
      const errorData = await response.json();
      return res.status(422).json({
        error: 'Validation error',
        details: errorData.detail
      });
    }
    
    if (!response.ok) {
      console.error(`Error creating template: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to create template' });
    }
    
    const template = await response.json();
    
    // Add user access records if users are specified
    if (templateData.users && templateData.users.length > 0) {
      const templateId = template.template_id;
      
      // Process each user access record sequentially
      for (const user of templateData.users) {
        const accessData = {
          template_id: templateId,
          user_id: user.user_id,
          access_type: user.access_type || 'editor'
        };
        
        await fetch(`${FASTAPI_URL}/templates/${templateId}/access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(accessData)
        });
      }
    }
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/templates/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${FASTAPI_URL}/templates/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Template not found' });
      }
      console.error(`Error fetching template: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch template' });
    }
    
    const template = await response.json();
    
    // Get users with access to this template
    const accessResponse = await fetch(`${FASTAPI_URL}/templates/${id}/access`);
    let users = [];
    
    if (accessResponse.ok) {
      users = await accessResponse.json();
    }
    
    template.users = users;
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/templates/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    
    // Update template metadata
    const response = await fetch(`${FASTAPI_URL}/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: templateData.name,
        purpose: templateData.purpose,
        type: templateData.type
      })
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      console.error(`Error updating template: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to update template' });
    }
    
    const template = await response.json();
    
    // Update user access if provided
    if (templateData.users) {
      // First, get current access records
      const currentAccessResponse = await fetch(`${FASTAPI_URL}/templates/${id}/access`);
      let currentUsers = [];
      
      if (currentAccessResponse.ok) {
        currentUsers = await currentAccessResponse.json();
      }
      
      // Determine users to add and remove
      const currentUserIds = currentUsers.map(u => u.user_id);
      const newUserIds = templateData.users.map(u => u.user_id);
      
      // Users to remove
      const usersToRemove = currentUserIds.filter(id => !newUserIds.includes(id));
      
      // Users to add or update
      const usersToAddOrUpdate = templateData.users.filter(u => !currentUserIds.includes(u.user_id) || 
        currentUsers.find(cu => cu.user_id === u.user_id && cu.access_type !== u.access_type));
      
      // Process removals
      for (const userId of usersToRemove) {
        await fetch(`${FASTAPI_URL}/templates/${id}/access/${userId}`, {
          method: 'DELETE'
        });
      }
      
      // Process additions/updates
      for (const user of usersToAddOrUpdate) {
        const accessData = {
          template_id: parseInt(id),
          user_id: user.user_id,
          access_type: user.access_type || 'editor'
        };
        
        // For updates, first remove the existing record then add a new one
        if (currentUserIds.includes(user.user_id)) {
          await fetch(`${FASTAPI_URL}/templates/${id}/access/${user.user_id}`, {
            method: 'DELETE'
          });
        }
        
        await fetch(`${FASTAPI_URL}/templates/${id}/access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(accessData)
        });
      }
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/templates/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${FASTAPI_URL}/templates/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Template not found' });
      }
      console.error(`Error deleting template: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to delete template' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Template questions endpoints
app.get('/api/templates/:id/questions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${FASTAPI_URL}/templates/${id}/questions`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Template not found' });
      }
      console.error(`Error fetching template questions: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch template questions' });
    }
    
    const questions = await response.json();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching template questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/templates/:id/questions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;
    
    // Format questions for FastAPI endpoint
    const formattedQuestions = questions.map((q, index) => ({
      question_id: q.question_id,
      order: q.order || index + 1
    }));
    
    const response = await fetch(`${FASTAPI_URL}/templates/${id}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedQuestions)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Template or question not found' });
      }
      if (response.status === 422) {
        const errorData = await response.json();
        return res.status(422).json({
          error: 'Validation error',
          details: errorData.detail
        });
      }
      console.error(`Error adding questions to template: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to add questions to template' });
    }
    
    const result = await response.json();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding questions to template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/templates/:templateId/questions/:questionId', verifyToken, async (req, res) => {
  try {
    const { templateId, questionId } = req.params;
    const response = await fetch(`${FASTAPI_URL}/templates/${templateId}/questions/${questionId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Template or question not found' });
      }
      console.error(`Error removing question from template: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to remove question from template' });
    }
    
    res.json({ message: 'Question removed from template successfully' });
  } catch (error) {
    console.error('Error removing question from template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy middleware options for audit
const auditProxyOptions = {
  target: FASTAPI_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/audit': '/audit',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add user information from JWT token if available
    if (req.user && req.body && !req.body.user_id) {
      req.body.user_id = req.user.user_id;
    }

    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
};

// Audit routes
app.post('/api/audit', verifyToken, async (req, res) => {
  try {
    // Add user information from JWT token if not provided
    const auditData = { ...req.body };
    if (!auditData.user_id) {
      auditData.user_id = req.user.user_id;
    }
    
    // Add IP address and user agent if not provided
    if (!auditData.ip_address) {
      auditData.ip_address = req.ip;
    }
    if (!auditData.user_agent) {
      auditData.user_agent = req.headers['user-agent'];
    }
    
    // Forward the request to FastAPI
    const response = await axios.post(`${FASTAPI_URL}/audit`, auditData);
    
    // Return the FastAPI response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error creating audit log:', error);
    
    // Forward validation errors
    if (error.response && error.response.status === 422) {
      return res.status(422).json({
        message: 'Validation error',
        details: error.response.data.detail
      });
    }
    
    // Forward other errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to create audit log',
        error: error.response.data
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Failed to create audit log',
      error: error.message
    });
  }
});

// GET route for audit logs (admin only)
app.get('/api/audit', verifyToken, async (req, res) => {
  try {
    // Check if user is an administrator
    const isAdmin = req.user && req.user.access_type === 'administrator';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Administrator access required' });
    }
    
    // Forward query parameters
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${FASTAPI_URL}/audit${queryParams ? `?${queryParams}` : ''}`;
    
    // Get audit logs from FastAPI
    const response = await axios.get(url);
    
    // Return the FastAPI response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    
    // Forward errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to fetch audit logs',
        error: error.response.data
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// GET route for specific audit log by ID (admin only)
app.get('/api/audit/:audit_id', verifyToken, async (req, res) => {
  try {
    // Check if user is an administrator
    const isAdmin = req.user && req.user.access_type === 'administrator';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Administrator access required' });
    }
    
    // Get audit log from FastAPI
    const response = await axios.get(`${FASTAPI_URL}/audit/${req.params.audit_id}`);
    
    // Return the FastAPI response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    
    // Forward errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to fetch audit log',
        error: error.response.data
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

// Update user (admin only)
app.put('/api/users/:user_id', verifyToken, async (req, res) => {
  try {
    // Check if user is an administrator
    const isAdmin = req.user && req.user.access_type === 'administrator';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Administrator access required' });
    }
    
    const userId = req.params.user_id;
    const userData = {...req.body};
    
    // If trying to update role, use the user-roles endpoint instead
    if (userData.role || userData.access_type) {
      const accessType = userData.role || userData.access_type;
      try {
        await axios.post(`${FASTAPI_URL}/user-roles`, { 
          user_id: userId, 
          access_type: accessType 
        });
      } catch (roleError) {
        console.error('Error updating role:', roleError);
      }
      
      // Remove role/access_type from userData to avoid errors
      delete userData.role;
      delete userData.access_type;
    }
    
    // If there are remaining fields to update (like username, email)
    if (Object.keys(userData).length > 0) {
      // Forward the request to FastAPI
      const response = await axios.put(`${FASTAPI_URL}/users/${userId}`, userData);
      
      // Return the FastAPI response
      return res.status(response.status).json(response.data);
    } else {
      // If we only updated the role, return success
      return res.status(200).json({ 
        message: 'User updated successfully',
        user_id: userId
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Forward errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to update user',
        error: error.response.data
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Update user role (admin only)
app.post('/api/user-roles', verifyToken, async (req, res) => {
  try {
    // Check if user is an administrator
    const isAdmin = req.user && req.user.access_type === 'administrator';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Administrator access required' });
    }
    
    const { user_id, access_type } = req.body;
    
    // Validate access_type
    const validTypes = ['administrator', 'editor', 'user'];
    if (!validTypes.includes(access_type)) {
      return res.status(400).json({ 
        message: 'Invalid access_type',
        validTypes
      });
    }
    
    // Forward the request to FastAPI
    const response = await axios.post(`${FASTAPI_URL}/user-roles`, { user_id, access_type });
    
    // Return the FastAPI response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error updating user role:', error);
    
    // Forward errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to update user role',
        error: error.response.data
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// Get user roles (admin only)
app.get('/api/user-roles', verifyToken, async (req, res) => {
  try {
    // Check if user is an administrator
    const isAdmin = req.user && req.user.access_type === 'administrator';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Administrator access required' });
    }
    
    // Get all users from FastAPI
    const usersResponse = await axios.get(`${FASTAPI_URL}/users`);
    const users = usersResponse.data;
    
    // Get all user roles from FastAPI
    const rolesResponse = await axios.get(`${FASTAPI_URL}/user-roles`);
    const roles = rolesResponse.data;
    
    // Combine user details with roles
    const usersWithRoles = users.map(user => {
      const userRole = roles.find(r => r.user_id === user.user_id) || { access_type: 'user' };
      return {
        ...user,
        access_type: userRole.access_type
      };
    });
    
    // Return combined data
    res.json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    
    // Forward errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Failed to fetch user roles',
        error: error.response.data
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Failed to fetch user roles',
      error: error.message
    });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 