import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Paper, List, ListItem,
  ListItemText, IconButton, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress,
  Alert, Snackbar, Checkbox, ListItemIcon, Tooltip, Card,
  CardContent, Grid
} from '@mui/material';
import {
  ArrowBack, Save, Delete, Add, DragIndicator,
  ArrowUpward, ArrowDownward, Search
} from '@mui/icons-material';
import { templateServices, questionServices } from '../services/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const TemplateQuestionsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch template data
        const templateData = await templateServices.getTemplateById(id);
        setTemplate(templateData);
        
        // Fetch template questions
        const templateQuestions = await templateServices.getTemplateQuestions(id);
        setQuestions(templateQuestions || []);
        
        // Fetch all available questions
        const allQuestions = await questionServices.getAllQuestions();
        setAvailableQuestions(allQuestions || []);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load template data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
    setSearchQuery('');
    setSelectedQuestions([]);
  };
  
  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };
  
  const handleAddQuestions = () => {
    // Get the selected questions and add them to the template questions
    const newQuestions = availableQuestions
      .filter(q => selectedQuestions.includes(q.question_id))
      .filter(q => !questions.some(tq => tq.question_id === q.question_id)); // Filter out already added questions
    
    // Add to the end of the list
    setQuestions([...questions, ...newQuestions]);
    
    // Close the dialog
    setAddDialogOpen(false);
    setSelectedQuestions([]);
  };
  
  const handleRemoveQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.question_id !== questionId));
  };
  
  const handleMoveQuestion = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the questions
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    setQuestions(newQuestions);
  };
  
  const handleDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setQuestions(items);
  };
  
  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Map questions to template questions format
      const templateQuestions = questions.map((question, index) => ({
        question_id: question.question_id,
        order: index + 1
      }));
      
      // Save to API
      await templateServices.addQuestionsToTemplate(id, templateQuestions);
      
      setSuccess(true);
      setError(null);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/templates/view/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error saving template questions:', err);
      setError('Failed to save template questions. Please try again later.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate(`/templates/view/${id}`);
  };
  
  const filteredAvailableQuestions = availableQuestions.filter(q => {
    // Filter out questions already in the template
    const isAlreadyAdded = questions.some(tq => tq.question_id === q.question_id);
    
    // Filter by search query
    const matchesSearch = searchQuery === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.phase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.section.toLowerCase().includes(searchQuery.toLowerCase());
    
    return !isAlreadyAdded && matchesSearch;
  });
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Manage Template Questions
            </Typography>
            {template && (
              <Typography variant="subtitle1" color="text.secondary">
                {template.name}
              </Typography>
            )}
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={handleCancel}
          >
            Back to Template
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Questions in Template
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />} 
            onClick={handleOpenAddDialog}
          >
            Add Questions
          </Button>
        </Box>
        
        {questions.length === 0 ? (
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>No Questions Added</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This template doesn't have any questions yet. Add questions to get started.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />} 
                onClick={handleOpenAddDialog}
              >
                Add Questions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="droppable">
              {(provided) => (
                <Paper variant="outlined" sx={{ mb: 4 }}>
                  <List {...provided.droppableProps} ref={provided.innerRef}>
                    {questions.map((question, index) => (
                      <Draggable 
                        key={question.question_id} 
                        draggableId={question.question_id.toString()} 
                        index={index}
                      >
                        {(provided) => (
                          <React.Fragment>
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              secondaryAction={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Tooltip title="Move Up">
                                    <span>
                                      <IconButton 
                                        edge="end" 
                                        disabled={index === 0}
                                        onClick={() => handleMoveQuestion(index, 'up')}
                                      >
                                        <ArrowUpward />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Move Down">
                                    <span>
                                      <IconButton 
                                        edge="end" 
                                        disabled={index === questions.length - 1}
                                        onClick={() => handleMoveQuestion(index, 'down')}
                                      >
                                        <ArrowDownward />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Remove Question">
                                    <IconButton 
                                      edge="end" 
                                      color="error"
                                      onClick={() => handleRemoveQuestion(question.question_id)}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              }
                            >
                              <ListItemIcon {...provided.dragHandleProps}>
                                <DragIndicator />
                              </ListItemIcon>
                              <ListItemText
                                primary={question.question}
                                secondary={
                                  <React.Fragment>
                                    <Typography component="span" variant="body2" color="text.primary">
                                      {question.phase} - {question.section}
                                    </Typography>
                                    {" — "}{question.context}
                                  </React.Fragment>
                                }
                              />
                            </ListItem>
                            {index < questions.length - 1 && <Divider />}
                          </React.Fragment>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                </Paper>
              )}
            </Droppable>
          </DragDropContext>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Questions'}
          </Button>
        </Box>
      </Paper>
      
      {/* Add Questions Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Add Questions to Template</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <TextField
              fullWidth
              placeholder="Search questions..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />
              }}
            />
          </Box>
          
          {filteredAvailableQuestions.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4 }}>
              No matching questions found.
            </Typography>
          ) : (
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                {filteredAvailableQuestions.map((question) => (
                  <React.Fragment key={question.question_id}>
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedQuestions.includes(question.question_id)}
                          onChange={() => handleQuestionSelect(question.question_id)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={question.question}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary">
                              {question.phase} - {question.section}
                            </Typography>
                            {" — "}{question.context}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleAddQuestions} 
            color="primary" 
            variant="contained"
            disabled={selectedQuestions.length === 0}
          >
            Add Selected ({selectedQuestions.length})
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Template questions saved successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TemplateQuestionsPage; 