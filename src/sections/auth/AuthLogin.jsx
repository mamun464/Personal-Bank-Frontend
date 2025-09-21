import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import axios from 'axios';

// react-bootstrap
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import InputGroup from 'react-bootstrap/InputGroup';
import Stack from 'react-bootstrap/Stack';
import { Modal } from 'react-bootstrap';

// .meta.env.BACKEND_URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// third-party
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// project-imports
import MainCard from 'components/MainCard';
import { emailSchema, passwordSchema } from 'utils/validationSchema';

// assets
import DarkLogo from 'assets/images/bank_logo.png';

// ==============================|| AUTH LOGIN FORM ||============================== //

export default function AuthLoginForm({ className, link }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoader, SetResendLoader] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [user_data, setUser_data] = useState(null);
  const [token, setToken] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  useEffect(() => {
    localStorage.clear();
  }, []);

  // Timer logic for resend button
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/user-api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        })
      });

      const result = await response.json();

      // Check API success
      if (!response.ok || !result.success) {
        // Use the API message for errors
        toast.error(result.message || 'Login failed');
        setLoading(false);
        return;
      }

      // ✅ Save access token as authkey
      // Check if user is active
      if (result.user_data?.is_verified) {
        // Save to localStorage
        if (result.token?.access) localStorage.setItem('authkey', result.token.access);
        if (result.user_data) localStorage.setItem('user', JSON.stringify(result.user_data));

        toast.success(result.message || 'Successfully logged in');
        window.location.href = '/';
      } else {
        // User inactive → open OTP modal
        console.log('Longin response user data: ', result);

        setUser_data(result.user_data);
        setToken(result.token);
        setShowOtpModal(true);
        setTimer(60);
        toast.info('Please verify your account via OTP.');
      }
    } catch (error) {
      // Network or other unexpected errors
      console.error('Error during login:', error);
      toast.error(error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false); // stop loading after API call
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error('Please first enter OTP.');
      return;
    }

    setLoading(true); // Show loading state

    try {
      const response = await axios.post(
        `${BACKEND_URL}/user-api/verify-email/`,
        { otp_code: otp },
        {
          headers: {
            Authorization: `Bearer ${token?.access}` // token from user_data
          }
        }
      );

      if (response.status === 200 && response.data?.success) {
        toast.success(response.data?.message || 'OTP verified successfully!');

        // ✅ Save both user and authkey in localStorage
        const updatedUserData = {
          ...user_data,
          is_verified: true
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        localStorage.setItem('authkey', token?.access);

        // ✅ Close modal
        setShowOtpModal(false);
        // ✅ Redirect to homepage or dashboard
        window.location.href = '/';
      } else {
        // ✅ Show API error message if success is false
        toast.error(response.data?.message || 'OTP verification failed!');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.clear(); // clear user + authkey
        window.location.href = '/login'; // redirect to login page
        return;
      }
      // ✅ Show backend message if present, else fallback
      toast.error(error.response?.data?.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    SetResendLoader(true);
    try {
      if (!token) {
        toast.error('No token found. Please login again.');
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/user-api/resend-otp/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token?.access}` // token from user_data
          }
        }
      );

      if (response.status === 200 && response.data.success) {
        toast.info(response.data?.message || 'OTP resent successfully!');
        setTimer(5);
        SetResendLoader(false);
      } else {
        toast.error(response.data?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error during OTP resend:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.clear(); // clear user + authkey
        window.location.href = '/login'; // redirect to login page
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      SetResendLoader(false);
    }
  };
  // Password reset modal state
  const validateEmail = (value) => {
    if (!value) return emailSchema.required;
    const emailPattern = new RegExp(emailSchema.pattern.value);
    if (!emailPattern.test(value)) return emailSchema.pattern.message;
    return '';
  };

  const handleResetChange = (e) => {
    const value = e.target.value;
    setResetEmail(value);
    setResetError(validateEmail(value));
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    const error = validateEmail(resetEmail);
    if (error) {
      setResetError(error);
      return;
    }

    setResetLoading(true);
    try {
      // Replace with your backend API
      const response = await axios.post(`${BACKEND_URL}/user-api/send-reset-link/`, {
        email: resetEmail
      });

      toast.success(response.data.message || 'Password reset email sent!');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send reset email!');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <MainCard className="mb-0">
        <div className="text-center">
          <a>
            <Image src={DarkLogo} alt="img" width="100" height="100" className="img-fluid" />
          </a>
        </div>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <h4 className={`text-center f-w-500 mt-4 mb-3 ${className}`}>Login</h4>
          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Control
              type="email"
              placeholder="Email Address"
              {...register('email', emailSchema)}
              isInvalid={!!errors.email}
              className={className && 'bg-transparent border-white text-white border-opacity-25 '}
            />
            <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formPassword">
            <InputGroup>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...register('password', passwordSchema)}
                isInvalid={!!errors.password}
                className={className && 'bg-transparent border-white text-white border-opacity-25 '}
                title="Password must be at least 6 characters."
              />
              <Button onClick={togglePasswordVisibility}>
                {showPassword ? <i className="ti ti-eye" /> : <i className="ti ti-eye-off" />}
              </Button>
            </InputGroup>
            <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
          </Form.Group>

          <Stack direction="horizontal" className="mt-1 justify-content-between align-items-center">
            <Form.Group controlId="customCheckc1">
              <Form.Check
                type="checkbox"
                label="Remember me?"
                defaultChecked
                className={`input-primary ${className ? className : 'text-muted'} `}
              />
            </Form.Group>
            <a
              href="#!"
              className={`link-primary f-w-400 mb-0  ${className}`}
              style={{ textDecoration: 'none' }}
              onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.target.style.textDecoration = 'none')}
              onClick={() => setShowResetModal(true)}
              disabled={resetLoading}
            >
              Forgot Password?
            </a>
          </Stack>
          <div className="text-center mt-4">
            <Button type="submit" className="shadow px-sm-4" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </div>
          <Stack direction="horizontal" className="justify-content-between align-items-end mt-4">
            <h6 className={`f-w-500 mb-0 ${className}`}>Don't have an Account?</h6>
            <a href={link} className="link-primary">
              Create Account
            </a>
          </Stack>
        </Form>
      </MainCard>
      {/* OTP Verification Modal */}
      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>OTP Verification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Enter OTP</Form.Label>
            <Form.Control type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter your OTP" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleVerifyOtp} disabled={loading || resendLoader}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>
          <Button variant="secondary" onClick={handleResendOtp} disabled={timer > 0 || resendLoader || loading}>
            {resendLoader ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Sending...
              </>
            ) : timer > 0 ? (
              `Resend OTP in ${timer}s`
            ) : (
              'Resend OTP'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showResetModal} onHide={resetLoading ? () => {} : () => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Password Reset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleResetSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={resetEmail}
                onChange={handleResetChange}
                isInvalid={!!resetError}
                placeholder="Enter your email"
              />
              <Form.Control.Feedback type="invalid">{resetError}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="primary" type="submit">
                {resetLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* // ==============================|| PASSWORD RESET MODAL ||============================== // */}
      <Modal show={showResetModal} onHide={resetLoading ? () => {} : () => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Password Reset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleResetSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={resetEmail}
                onChange={handleResetChange}
                isInvalid={!!resetError}
                placeholder="Enter your email"
              />
              <Form.Control.Feedback type="invalid">{resetError}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="primary" type="submit" disabled={resetLoading}>
                {resetLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      {/* ==============================|| ERROR TOAST ||============================== */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

AuthLoginForm.propTypes = { className: PropTypes.string, link: PropTypes.string, resetLink: PropTypes.string };
