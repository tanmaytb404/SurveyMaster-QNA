import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AddQuestionPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      // Debug user information
      console.log("User info:", user);
      console.log("Token available:", !!user?.token);
      
      if (!user || !user.user_id) {
        throw new Error('User information is missing. Please log in again.');
      }
      
      // Make sure user_id is a number and not null
      const userId = parseInt(user.user_id, 10);
      if (isNaN(userId) || !userId) {
        throw new Error('Invalid user ID. Please log in again.');
      }
      
      const questionData = {
        ...values,
        created_by: userId  // Use parsed integer value
      };
      
      const result = await questionServices.createQuestion(questionData);
      console.log("Response from createQuestion:", result);
      navigate('/questions');
    } catch (error) {
      console.error('Error creating question:', error);
      let errorMessage = 'Failed to create question. Please try again.';
      
      if (error.details) {
        errorMessage = `Validation error: ${JSON.stringify(error.details)}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus({ error: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg border-0 rounded-lg mt-4">
            <div className="card-header">
              <h3 className="text-center font-weight-light my-2">Add New Question</h3>
            </div>
            <div className="card-body">
              <Formik
                initialValues={{
                  context: '',
                  question: '',
                  phase: '',
                  section: '',
                  answer_type: ''
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
                        {isSubmitting ? 'Saving...' : 'Save Question'}
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

export default AddQuestionPage; 