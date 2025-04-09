import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, MenuItem,
  FormControl, InputLabel, Select, Chip, OutlinedInput, Paper,
  Grid, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { templateServices, authServices } from '../services/api';

const TEMPLATE_TYPES = [
  'Assessment',
  'Survey',
  'Questionnaire',
  'Feedback',
  'Other'
];

const ACCESS_TYPES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' }
];

const TemplateFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id;
  
  // Form state
  const [templateData, setTemplateData] = useState({
    name: '',
    purpose: '',
    type: 'Assessment',
    users: []
  });
  
  // UI state
  const [loading, setLoading] = useState(isEditMode || location.search.includes('from='));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  
  useEffect(() => {
    // Load users for access selection
    const fetchUsers = async () => {
      try {
        const response = await authServices.getUsers();
        setAvailableUsers(response);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load user list. Some features may be limited.');
      }
    };
    
    // Load template data if in edit mode or creating from existing
    const fetchTemplateData = async () => {
      try {
        let templateId = id;
        
        // If creating from existing, get the template ID from query param
        if (!isEditMode && location.search.includes('from=')) {
          const fromId = new URLSearchParams(location.search).get('from');
          if (fromId) {
            templateId = fromId;
          }
        }
        
        if (templateId) {
          const data = await templateServices.getTemplateById(templateId);
          
          // If creating from existing, modify the data slightly
          if (!isEditMode) {
            setTemplateData({
              name: `Copy of ${data.name}`,
              purpose: data.purpose,
              type: data.type,
              users: data.users || []
            });
          } else {
            setTemplateData({
              name: data.name,
              purpose: data.purpose,
              type: data.type,
              users: data.users || []
            });
          }
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching template:', err);
        setError('Failed to load template data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    if (isEditMode || location.search.includes('from=')) {
      fetchTemplateData();
    } else {
      setLoading(false);
    }
  }, [id, isEditMode, location.search]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplateData({
      ...templateData,
      [name]: value
    });
  };
  
  const handleUserAccessChange = (e, userId) => {
    const { value } = e.target;
    setTemplateData({
      ...templateData,
      users: templateData.users.map(user => 
        user.user_id === userId 
          ? { ...user, access_type: value } 
          : user
      )
    });
  };
  
  const handleUserAdd = (e) => {
    const { value } = e.target;
    
    if (!value) return;
    
    // Check if user is already added
    const userExists = templateData.users.some(u => u.user_id === parseInt(value));
    
    if (!userExists) {
      const selectedUser = availableUsers.find(u => u.user_id === parseInt(value));
      
      setTemplateData({
        ...templateData,
        users: [
          ...templateData.users,
          { 
            user_id: selectedUser.user_id,
            username: selectedUser.username,
            access_type: 'editor' 
          }
        ]
      });
    }
    
    // Reset the select
    e.target.value = '';
  };
  
  const handleUserRemove = (userId) => {
    setTemplateData({
      ...templateData,
      users: templateData.users.filter(user => user.user_id !== userId)
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const submitData = {
        ...templateData,
        created_by: userData.userId
      };
      
      let response;
      if (isEditMode) {
        response = await templateServices.updateTemplate(id, submitData);
      } else {
        response = await templateServices.createTemplate(submitData);
      }
      
      setSuccess(true);
      
      // Navigate back to templates list after a short delay
      setTimeout(() => {
        navigate('/templates');
      }, 1500);
      
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template. Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/templates');
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            {isEditMode ? 'Edit Template' : 'Create New Template'}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={handleCancel}
          >
            Back
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Template Name"
                name="name"
                value={templateData.name}
                onChange={handleChange}
                helperText="Enter a descriptive name for the template"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose"
                name="purpose"
                value={templateData.purpose}
                onChange={handleChange}
                multiline
                rows={3}
                helperText="Describe the purpose or use case for this template"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="type-label">Template Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={templateData.type}
                  onChange={handleChange}
                  label="Template Type"
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                User Access
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="add-user-label">Add User</InputLabel>
                <Select
                  labelId="add-user-label"
                  label="Add User"
                  onChange={handleUserAdd}
                  defaultValue=""
                >
                  <MenuItem value="">
                    <em>Select a user to add</em>
                  </MenuItem>
                  {availableUsers
                    .filter(user => !templateData.users.some(u => u.user_id === user.user_id))
                    .map((user) => (
                      <MenuItem key={user.user_id} value={user.user_id}>
                        {user.username} ({user.email})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              
              {templateData.users.length > 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Users with access:
                  </Typography>
                  <Grid container spacing={2}>
                    {templateData.users.map((user) => (
                      <Grid item xs={12} key={user.user_id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography>
                            {user.username}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                              <Select
                                value={user.access_type || 'editor'}
                                onChange={(e) => handleUserAccessChange(e, user.user_id)}
                                size="small"
                              >
                                {ACCESS_TYPES.map((type) => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => handleUserRemove(user.user_id)}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ) : (
                <Alert severity="info">
                  No users have been granted access to this template. By default, only you will have access.
                </Alert>
              )}
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Template saved successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TemplateFormPage; 