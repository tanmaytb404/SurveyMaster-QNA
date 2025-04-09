import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, 
  FormControl, InputLabel, Select, MenuItem, TextField,
  Grid, Button, Box, CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import { auditServices } from '../services/api';
import AuthContext from '../context/AuthContext';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    user_id: '',
    entity_type: '',
    action_type: '',
  });

  useEffect(() => {
    // Check if user is admin
    const isAdmin = user && user.access_type === 'administrator';
    
    if (!isAdmin) {
      navigate('/'); // Redirect non-admin users
      return;
    }
    
    fetchAuditLogs();
  }, [navigate, user, page, rowsPerPage]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare query parameters
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const data = await auditServices.getAuditLogs(params);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    setPage(0);
    fetchAuditLogs();
  };

  const resetFilters = () => {
    setFilters({
      user_id: '',
      entity_type: '',
      action_type: '',
    });
    setPage(0);
    fetchAuditLogs();
  };

  // Format datetime to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Format JSON values in old_values and new_values
  const formatJsonValues = (jsonString) => {
    if (!jsonString) return 'N/A';
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Audit Logs
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="User ID"
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="entity-type-label">Entity Type</InputLabel>
              <Select
                labelId="entity-type-label"
                name="entity_type"
                value={filters.entity_type}
                onChange={handleFilterChange}
                label="Entity Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="QUESTION">Question</MenuItem>
                <MenuItem value="TEMPLATE">Template</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="action-type-label">Action Type</InputLabel>
              <Select
                labelId="action-type-label"
                name="action_type"
                value={filters.action_type}
                onChange={handleFilterChange}
                label="Action Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CREATE">Create</MenuItem>
                <MenuItem value="UPDATE">Update</MenuItem>
                <MenuItem value="DELETE">Delete</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box display="flex" gap={1}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={applyFilters}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetFilters}
                startIcon={<RefreshIcon />}
              >
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="audit logs table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity Type</TableCell>
                  <TableCell>Entity ID</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.audit_id}>
                      <TableCell>{log.audit_id}</TableCell>
                      <TableCell>{log.user_id}</TableCell>
                      <TableCell>{log.action_type}</TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell>{log.entity_id}</TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={-1}  // Unknown total count, can be updated if backend provides it
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelDisplayedRows={({ from, to }) => `${from}-${to}`}
          />
        </>
      )}
    </Container>
  );
};

export default AuditLogsPage; 