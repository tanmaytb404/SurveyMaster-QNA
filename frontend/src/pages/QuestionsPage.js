import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { questionServices } from '../services/api';
import AuthContext from '../context/AuthContext';

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch questions
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await questionServices.getAllQuestions();
        setQuestions(data);
        setError('');
      } catch (err) {
        setError('Failed to load questions. Please try again later.');
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [isAuthenticated, navigate]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionServices.deleteQuestion(id);
        setQuestions(questions.filter(question => question.question_id !== id));
      } catch (err) {
        setError('Failed to delete question. Please try again.');
        console.error('Error deleting question:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Questions</h1>
        <Link to="/questions/add" className="btn btn-primary">
          Add New Question
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="card no-questions">
          <div className="card-body text-center">
            <h3 className="mb-3">No questions added</h3>
            <p className="text-muted">Click the button to add your first question</p>
            <Link to="/questions/add" className="btn btn-primary mt-3">
              Add Question
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {questions.map((question) => (
            <div className="col-md-6 mb-4" key={question.question_id}>
              <div className="card question-card h-100">
                <div className="card-body">
                  <h5 className="card-title">{question.question}</h5>
                  <p className="card-text text-truncate mb-2">{question.context}</p>
                  <div className="d-flex justify-content-between mt-3">
                    <div>
                      <span className="badge bg-primary me-2">{question.phase}</span>
                      <span className="badge bg-secondary me-2">{question.section}</span>
                      <span className="badge bg-info">{question.answer_type}</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent d-flex justify-content-end">
                  <Link 
                    to={`/questions/edit/${question.question_id}`}
                    className="btn btn-sm btn-outline-primary me-2"
                  >
                    Edit
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(question.question_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsPage; 