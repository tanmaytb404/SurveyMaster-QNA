import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthContext from '../context/AuthContext';
import { authServices } from '../services/api';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});

const LoginPage = () => {
  const [loginError, setLoginError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoginError('');
      const userData = await authServices.login(values);
      login(userData);
      navigate('/');
    } catch (error) {
      setLoginError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-lg border-0 rounded-lg mt-5">
            <div className="card-header">
              <h3 className="text-center font-weight-light my-4">Login</h3>
            </div>
            <div className="card-body">
              {loginError && (
                <div className="alert alert-danger" role="alert">
                  {loginError}
                </div>
              )}
              
              <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={loginSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        placeholder="Enter your email"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-danger"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password</label>
                      <Field
                        type="password"
                        id="password"
                        name="password"
                        className="form-control"
                        placeholder="Enter your password"
                      />
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-danger"
                      />
                    </div>
                    
                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Logging in...' : 'Login'}
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

export default LoginPage; 