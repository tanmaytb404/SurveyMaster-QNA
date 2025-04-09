import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Box, 
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import { authServices } from '../services/api';
import AuthContext from '../context/AuthContext';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    // Check if user is admin
    const isAdmin = user && user.access_type === 'administrator';
    
    if (!isAdmin) {
      navigate('/'); // Redirect non-admin users
      return;
    }
    
    fetchUsers();
  }, [navigate, user]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await authServices.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.access_type || 'user');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (event) => {
    setNewRole(event.target.value);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    try {
      await authServices.updateUserRole(selectedUser.user_id, newRole);
      setUsers(users.map(u => 
        u.user_id === selectedUser.user_id ? { ...u, access_type: newRole } : u
      ));
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role. Please try again later.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.user_id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.access_type || 'user'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                      >
                        Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Role Change Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 250, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={newRole}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="user">Normal User</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="administrator">Administrator</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateRole} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage; 