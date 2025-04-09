import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Paper, List, ListItem,
  ListItemText, Divider, CircularProgress, Alert, Grid,
  Card, CardContent, CardActions, Chip
} from '@mui/material';
import {
  ArrowBack, Edit, ContentCopy, ListAlt
} from '@mui/icons-material';
import { templateServices } from '../services/api';

const TemplateViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const templateData = await templateServices.getTemplateById(id);
        setTemplate({
          template_id: templateData.template_id,
          name: templateData.name,
          purpose: templateData.purpose,
          type: templateData.type,
          created_at: templateData.created_at,
          updated_at: templateData.updated_at,
          created_by: templateData.created_by
        });
        
        setQuestions(templateData.questions || []);
        setUsers(templateData.users || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching template:', err);
        setError('Failed to load template. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleBack = () => {
    navigate('/templates');
  };
  
  const handleEdit = () => {
    navigate(`/templates/edit/${id}`);
  };
  
  const handleManageQuestions = () => {
    navigate(`/templates/questions/${id}`);
  };
  
  const handleCreateCopy = () => {
    navigate(`/templates/new?from=${id}`);
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!template && !loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Template not found. It may have been deleted or you don't have access to it.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Templates
        </Button>
      </Container>
    );
  }
  
  // Format dates for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Template Details
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={handleBack}
        >
          Back to Templates
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h5">
                {template?.name}
              </Typography>
              <Chip label={template?.type} color="primary" variant="outlined" />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Purpose
              </Typography>
              <Typography variant="body1">
                {template?.purpose || 'No purpose specified'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Template Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(template?.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(template?.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Users with Access
              </Typography>
              {users.length > 0 ? (
                <List dense disablePadding>
                  {users.map((user) => (
                    <ListItem key={user.user_id} disablePadding sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={user.username} 
                        secondary={`${user.access_type.charAt(0).toUpperCase() + user.access_type.slice(1)} Access`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No additional users have access to this template.
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Edit />}
                onClick={handleEdit}
                fullWidth
              >
                Edit Template
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ContentCopy />}
                onClick={handleCreateCopy}
                fullWidth
              >
                Create Copy
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Questions
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ListAlt />}
                onClick={handleManageQuestions}
              >
                Manage Questions
              </Button>
            </Box>
            
            {questions.length === 0 ? (
              <Card variant="outlined" sx={{ mt: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    No Questions Added
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This template doesn't have any questions yet.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleManageQuestions}
                  >
                    Add Questions
                  </Button>
                </CardActions>
              </Card>
            ) : (
              <Paper variant="outlined" sx={{ mb: 4, flex: 1, overflow: 'auto' }}>
                <List>
                  {questions.map((question, index) => (
                    <React.Fragment key={question.question_id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography component="span" variant="body1" color="text.primary" fontWeight="500">
                                {index + 1}. {question.question}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', mt: 1 }}>
                                {question.phase} - {question.section}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {question.context}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip 
                                  label={`Answer Type: ${question.answer_type}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </Box>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < questions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TemplateViewPage; 