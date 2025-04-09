import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Button, Grid, Paper, Table, 
  TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Box, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Edit, Delete, Visibility, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { templateServices } from '../services/api';

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateServices.getAllTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateNew = () => {
    navigate('/templates/new');
  };
  
  const handleCreateFromExisting = (template) => {
    navigate(`/templates/new?from=${template.template_id}`);
  };
  
  const handleEdit = (template) => {
    navigate(`/templates/edit/${template.template_id}`);
  };
  
  const handleView = (template) => {
    navigate(`/templates/view/${template.template_id}`);
  };
  
  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    
    try {
      await templateServices.deleteTemplate(templateToDelete.template_id);
      setTemplates(templates.filter(t => t.template_id !== templateToDelete.template_id));
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template. Please try again later.');
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Templates
        </Typography>
        <Typography>Loading templates...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Templates
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />} 
            onClick={handleCreateNew}
            sx={{ mr: 2 }}
          >
            Create New Template
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      {templates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No Templates Found</Typography>
          <Typography variant="body1" paragraph>
            You haven't created any templates yet. Get started by creating your first template.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />} 
            onClick={handleCreateNew}
          >
            Create New Template
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Table stickyHeader aria-label="templates table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow hover key={template.template_id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.purpose}</TableCell>
                    <TableCell>{template.type}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="info" 
                        aria-label="view template"
                        onClick={() => handleView(template)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        aria-label="edit template"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        aria-label="delete template"
                        onClick={() => handleDeleteClick(template)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the template "{templateToDelete?.name}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TemplatesPage; 