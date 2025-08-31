import PropTypes from 'prop-types';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// react-bootstrap
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Stack from 'react-bootstrap/Stack';
import { useNavigate } from 'react-router-dom';

// third-party
import { useForm } from 'react-hook-form';

// project-imports
import MainCard from 'components/MainCard';
import {
  confirmPasswordSchema,
  emailSchema,
  fullNameSchema,
  phoneNumberSchema,
  dateOfBirthSchema,
  firstNameSchema,
  lastNameSchema,
  passwordSchema
} from 'utils/validationSchema';

// assets
import DarkLogo from 'assets/images/bank_logo.png';

// .meta.env variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ==============================|| AUTH - PASSWORD RESET FORM ||============================== //

export default function AuthPasswordResetForm({ className, link }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAndCondition, setTermsAndCondition] = useState(false);
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors
  } = useForm();

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Both Password must be match!'
      });
      return;
    }

    if (!termsAndCondition) {
      toast.error('Please agree to all the Terms & Condition!');
      return;
    }

    clearErrors('confirmPassword');
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('password', data.password);
      formData.append('confirm_password', data.confirmPassword);

      const response = await axios.post(`${BACKEND_URL}/user-api/rest-password/${uid}/${token}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(response.data.message || 'Password reset successfully!');
      reset();
      setLoading(false);
      await new Promise((resolve) => setTimeout(resolve, 1300));
      navigate('/login');
    } catch (error) {
      console.error(error);

      if (error.response) {
        toast.error(error.response.data.message || 'Password reset failed!');
      } else {
        toast.error('Something went wrong!');
      }
    } finally {
      setLoading(false);
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
          <h4 className={`text-center f-w-500 mt-4 mb-3 ${className}`}>Create New Password</h4>

          <Form.Group className="mb-3" controlId="formPassword">
            <InputGroup>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...register('password', passwordSchema)}
                isInvalid={!!errors.password}
                className={className && 'bg-transparent border-white text-white border-opacity-25 '}
              />
              <Button onClick={togglePasswordVisibility}>
                {showPassword ? <i className="ti ti-eye" /> : <i className="ti ti-eye-off" />}
              </Button>
              <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formConfirmPassword">
            <Form.Control
              type="password"
              placeholder="Confirm Password"
              {...register('confirmPassword', confirmPasswordSchema)}
              isInvalid={!!errors.confirmPassword}
              className={className && 'bg-transparent border-white text-white border-opacity-25 '}
            />
            <Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
          </Form.Group>
          <Stack direction="horizontal" className="mt-1 justify-content-between">
            <Form.Group controlId="customCheckc1">
              <Form.Check
                type="checkbox"
                label="I agree to all the Terms & Condition"
                checked={termsAndCondition} // bind to state
                onChange={(e) => setTermsAndCondition(e.target.checked)} // update state
                className={`input-primary ${className ? className : 'text-muted'} `}
              />
            </Form.Group>
          </Stack>
          <div className="text-center mt-4">
            <Button type="submit" className="shadow px-sm-4" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </div>
          <Stack direction="horizontal" className="justify-content-between align-items-end mt-4">
            <h6 className={`f-w-500 mb-0 ${className}`}>Don't want to reset?</h6>
            <a href={link} className="link-primary">
              Login
            </a>
          </Stack>
        </Form>
      </MainCard>
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

AuthPasswordResetForm.propTypes = { className: PropTypes.string, link: PropTypes.string };
