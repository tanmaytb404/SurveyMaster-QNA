import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { questionServices } from '../services/api';
import AuthContext from '../context/AuthContext';

const questionSchema = Yup.object().shape({
  context: Yup.string()
    .required('Context is required'),
  question: Yup.string()
    .required('Question is required'),
  phase: Yup.string()
    .required('Phase is required'),
  section: Yup.string()
    .required('Section is required'),
  answer_type: Yup.string()
    .required('Answer type is required')
});

const EditQuestionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const data = await questionServices.getQuestionById(id);
        setQuestion(data);
      } catch (err) {
        setError('Failed to load question. Please try again later.');
        console.error('Error fetching question:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, isAuthenticated, navigate]);

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      await questionServices.updateQuestion(id, values);
      navigate('/questions');
    } catch (error) {
      setStatus({ error: error.message || 'Failed to update question. Please try again.' });
      console.error('Error updating question:', error);
    } finally {
      setSubmitting(false);
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

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/questions')}
        >
          Back to Questions
        </button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          Question not found
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/questions')}
        >
          Back to Questions
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg border-0 rounded-lg mt-4">
            <div className="card-header">
              <h3 className="text-center font-weight-light my-2">Edit Question</h3>
            </div>
            <div className="card-body">
              <Formik
                initialValues={{
                  context: question.context || '',
                  question: question.question || '',
                  phase: question.phase || '',
                  section: question.section || '',
                  answer_type: question.answer_type || '',
                  created_by: question.created_by
                }}
                validationSchema={questionSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, status }) => (
                  <Form>
                    {status && status.error && (
                      <div className="alert alert-danger" role="alert">
                        {status.error}
                      </div>
                    )}

                    <div className="mb-3">
                      <label htmlFor="context" className="form-label">Context</label>
                      <Field
                        as="textarea"
                        id="context"
                        name="context"
                        className="form-control"
                        placeholder="Enter question context"
                        rows="4"
                      />
                      <ErrorMessage
                        name="context"
                        component="div"
                        className="text-danger"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="question" className="form-label">Question</label>
                      <Field
                        as="textarea"
                        id="question"
                        name="question"
                        className="form-control"
                        placeholder="Enter your question"
                        rows="2"
                      />
                      <ErrorMessage
                        name="question"
                        component="div"
                        className="text-danger"
                      />
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label htmlFor="phase" className="form-label">Phase</label>
                        <Field
                          as="select"
                          id="phase"
                          name="phase"
                          className="form-select"
                        >
                          <option value="">Select Phase</option>
                          <option value="Initial">Initial</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </Field>
                        <ErrorMessage
                          name="phase"
                          component="div"
                          className="text-danger"
                        />
                      </div>

                      <div className="col-md-4">
                        <label htmlFor="section" className="form-label">Section</label>
                        <Field
                          as="select"
                          id="section"
                          name="section"
                          className="form-select"
                        >
                          <option value="">Select Section</option>
                          <option value="Technical">Technical</option>
                          <option value="Behavioral">Behavioral</option>
                          <option value="Coding">Coding</option>
                          <option value="Design">Design</option>
                        </Field>
                        <ErrorMessage
                          name="section"
                          component="div"
                          className="text-danger"
                        />
                      </div>

                      <div className="col-md-4">
                        <label htmlFor="answer_type" className="form-label">Answer Type</label>
                        <Field
                          as="select"
                          id="answer_type"
                          name="answer_type"
                          className="form-select"
                        >
                          <option value="">Select Answer Type</option>
                          <option value="Multiple Choice">Multiple Choice</option>
                          <option value="Short Answer">Short Answer</option>
                          <option value="Long Answer">Long Answer</option>
                          <option value="Code">Code</option>
                        </Field>
                        <ErrorMessage
                          name="answer_type"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/questions')}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Update Question'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionPage; 