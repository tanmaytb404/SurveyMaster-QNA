import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import QuestionsPage from './pages/QuestionsPage';
import AddQuestionPage from './pages/AddQuestionPage';
import EditQuestionPage from './pages/EditQuestionPage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateFormPage from './pages/TemplateFormPage';
import TemplateViewPage from './pages/TemplateViewPage';
import TemplateQuestionsPage from './pages/TemplateQuestionsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AdminPage from './pages/AdminPage';
import AuthContext from './context/AuthContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  //will called when user login
  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  //will called when user logout
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    //will provide the context to the app
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <div className="App">
        <Navbar />
        <div className="container mt-4">
          {/*kind of controller which will be used to navigate between pages*/}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/questions/add" element={<AddQuestionPage />} />
            <Route path="/questions/edit/:id" element={<EditQuestionPage />} />
            
            {/* Template Routes */}
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/new" element={<TemplateFormPage />} />
            <Route path="/templates/edit/:id" element={<TemplateFormPage />} />
            <Route path="/templates/view/:id" element={<TemplateViewPage />} />
            <Route path="/templates/questions/:id" element={<TemplateQuestionsPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
          </Routes>
        </div>
      </div>
    </AuthContext.Provider>
  );
}

export default App; 