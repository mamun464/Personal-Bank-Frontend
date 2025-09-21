import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// react-bootstrap
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Nav from 'react-bootstrap/Nav';
import Stack from 'react-bootstrap/Stack';
import Modal from 'react-bootstrap/Modal';

// project-imports
import MainCard from 'components/MainCard';
import SimpleBarScroll from 'components/third-party/SimpleBar';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// third-party
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// assets
import Img1 from 'assets/images/user/avatar-1.png';
import Img2 from 'assets/images/user/avatar-2.png';
import Img3 from 'assets/images/user/avatar-3.png';
import Img4 from 'assets/images/user/avatar-4.png';
import Img5 from 'assets/images/user/avatar-5.png';

// .meta.env variables
const IMG_BB_API_KEY = import.meta.env.VITE_IMG_BB_API_KEY;
const IMG_BB_API_URL = import.meta.env.VITE_IMG_BB_API_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

import {
  confirmPasswordSchema,
  emailSchema,
  fullNameSchema,
  phoneNumberSchema,
  dateOfBirthSchema,
  firstNameSchema,
  lastNameSchema,
  passwordSchema
} from '../../utils/validationSchema';

const notifications = [
  {
    id: 1,
    avatar: Img1,
    time: '2 min ago',
    title: 'UI/UX Design',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Today'
  },
  {
    id: 2,
    avatar: Img2,
    time: '1 hour ago',
    title: 'Message',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Today'
  },
  {
    id: 3,
    avatar: Img3,
    time: '2 hour ago',
    title: 'Forms',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Yesterday'
  },
  {
    id: 4,
    avatar: Img4,
    time: '12 hour ago',
    title: 'Challenge invitation',
    description: 'Jonny aber invites you to join the challenge',
    actions: true,
    date: 'Yesterday'
  },
  {
    id: 5,
    avatar: Img5,
    time: '5 hour ago',
    title: 'Security',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Yesterday'
  }
];

// =============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;
  const [userData, setUserData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  // State for modal form
  const [formData, setFormData] = useState({
    phone_no: '',
    name: '',
    date_of_birth: '',
    user_profile_img: ''
  });
  // inside Header component
  const [formErrors, setFormErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value) return fullNameSchema.required;
        if (!fullNameSchema.pattern.value.test(value)) return fullNameSchema.pattern.message;
        return '';
      case 'phone_no':
        if (!value) return phoneNumberSchema.required;
        if (!phoneNumberSchema.pattern.value.test(value)) return phoneNumberSchema.pattern.message;
        return '';
      case 'date_of_birth':
        if (!value) return dateOfBirthSchema.required;
        if (dateOfBirthSchema.validate) {
          const validationResult = dateOfBirthSchema.validate.ageMustBeAtLeast14(value);
          if (validationResult !== true) return validationResult;
        }
        return '';
      default:
        return '';
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Open modal and prefill form
  const handleOpenModal = () => {
    setFormData({
      phone_no: userData.phone_no || '',
      name: userData.name || '',
      date_of_birth: userData.date_of_birth || '',
      user_profile_img: userData.user_profile_img || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  // Handle profile image change
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Helper function to get file extension
    const getFileExtension = (filename) => {
      return filename.split('.').pop().toLowerCase();
    };

    // Check file extension
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtension = getFileExtension(file.name);
    if (!allowedExtensions.includes(fileExtension)) {
      setFormData((prev) => ({ ...prev, user_profile_img: '' })); // clear field
      toast.error('Invalid file type. Please select a JPG or PNG image.');
      return;
    }

    // Check file size (max 300kb)
    if (file.size > 300 * 1024) {
      setFormData((prev) => ({ ...prev, user_profile_img: '' })); // clear field
      toast.error('File size exceeds 300KB. Please select a smaller image.');
      return;
    }

    setLoading(true); // optional loading state

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await fetch(`${IMG_BB_API_URL}?key=${IMG_BB_API_KEY}`, {
        method: 'POST',
        body: uploadData
      });

      const data = await response.json();

      // Check for 401 at API response level
      if (data && data.success === false && data.status === 401) {
        console.error('Unauthorized response from ImgBB:', data);
        toast.error('Session expired. Please log in again.');
        localStorage.clear(); // clear stored user data
        window.location.href = '/login'; // redirect to login page
        return; // Stop execution
      }

      if (data && data.data && data.data.url) {
        setFormData((prev) => ({
          ...prev,
          user_profile_img: data.data.url
        }));
        toast.success('Image successfully selected!');
      } else {
        setFormData((prev) => ({ ...prev, user_profile_img: '' }));
        console.error('Invalid response from ImgBB:', data);
        toast.error('Something went wrong, please select again!');
      }
    } catch (error) {
      console.error('Error uploading image to ImgBB:', error);
      setFormData((prev) => ({ ...prev, user_profile_img: '' })); // Clear on failure
      console.error('Error uploading image to ImgBB:', error);
      toast.error('Something went wrong, please select again!');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate phone number before submitting
    // Validate all fields
    const errors = {};
    ['name', 'phone_no', 'date_of_birth'].forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const token = localStorage.getItem('authkey'); // your stored token
    const submitData = new FormData();

    // Use the state formData
    submitData.append('name', formData.name);
    submitData.append('phone_no', formData.phone_no);
    submitData.append('date_of_birth', formData.date_of_birth);
    submitData.append('user_profile_img', formData.user_profile_img || '');

    console.log('Submitting form data:', {
      name: formData.name,
      phone_no: formData.phone_no,
      date_of_birth: formData.date_of_birth,
      user_profile_img: formData.user_profile_img
    });

    setLoading(true);
    try {
      const response = await axios.patch(`${BACKEND_URL}/user-api/update-profile/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Profile update response:', response.data);
      toast.success('Profile updated successfully!');
      setShowModal(false);

      // Update localStorage if you want
      localStorage.setItem('user', JSON.stringify(response.data.user_data));
      await new Promise((resolve) => setTimeout(resolve, 400));
      window.location.reload();
    } catch (error) {
      // ✅ Check for 401 Unauthorized
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.clear(); // clear stored user data
        window.location.href = '/login'; // redirect to login page
        return;
      }
      console.error('Profile update error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <header className="pc-header">
      <div className="header-wrapper">
        <div className="me-auto pc-mob-drp">
          <Nav className="list-unstyled">
            <Nav.Item className="pc-h-item pc-sidebar-collapse">
              <Nav.Link
                as={Link}
                to="#"
                className="pc-head-link ms-0"
                id="sidebar-hide"
                onClick={() => {
                  handlerDrawerOpen(!drawerOpen);
                }}
              >
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            <Nav.Item className="pc-h-item pc-sidebar-popup">
              <Nav.Link as={Link} to="#" className="pc-head-link ms-0" id="mobile-collapse" onClick={() => handlerDrawerOpen(!drawerOpen)}>
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            <Dropdown className="pc-h-item dropdown">
              <Dropdown.Toggle variant="link" className="pc-head-link arrow-none m-0 trig-drp-search" id="dropdown-search">
                <i className="ph ph-magnifying-glass" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="pc-h-dropdown drp-search">
                <Form className="px-3 py-2">
                  <Form.Control type="search" placeholder="Search here. . ." className="border-0 shadow-none" />
                </Form>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </div>
        <div className="ms-auto">
          <Nav className="list-unstyled">
            <Dropdown className="pc-h-item" align="end">
              <Dropdown.Toggle className="pc-head-link me-0 arrow-none" variant="link" id="notification-dropdown">
                <i className="ph ph-bell" />
                <span className="badge bg-success pc-h-badge">3</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-notification pc-h-dropdown">
                <Dropdown.Header className="d-flex align-items-center justify-content-between">
                  <h5 className="m-0">Notifications</h5>
                  <Link className="btn btn-link btn-sm" to="#">
                    Mark all read
                  </Link>
                </Dropdown.Header>
                <SimpleBarScroll style={{ maxHeight: 'calc(100vh - 215px)' }}>
                  <div className="dropdown-body text-wrap position-relative">
                    {notifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        {index === 0 || notifications[index - 1].date !== notification.date ? (
                          <p className="text-span">{notification.date}</p>
                        ) : null}
                        <MainCard className="mb-0">
                          <Stack direction="horizontal" gap={3}>
                            <Image className="img-radius avatar rounded-0" src={notification.avatar} alt="Generic placeholder image" />
                            <div>
                              <span className="float-end text-sm text-muted">{notification.time}</span>
                              <h5 className="text-body mb-2">{notification.title}</h5>
                              <p className="mb-0">{notification.description}</p>
                              {notification.actions && (
                                <div className="mt-2">
                                  <Button variant="outline-secondary" size="sm" className="me-2">
                                    Decline
                                  </Button>
                                  <Button variant="primary" size="sm">
                                    Accept
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Stack>
                        </MainCard>
                      </React.Fragment>
                    ))}
                  </div>
                </SimpleBarScroll>

                <div className="text-center py-2">
                  <Link to="#!" className="link-danger">
                    Clear all Notifications
                  </Link>
                </div>
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown className="pc-h-item" align="end">
              <Dropdown.Toggle
                className="pc-head-link arrow-none me-0"
                variant="link"
                id="user-profile-dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i className="ph ph-user-circle" />
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-user-profile pc-h-dropdown p-0 overflow-hidden">
                <Dropdown.Header className="bg-primary">
                  <Stack direction="horizontal" gap={3} className="my-2">
                    <div className="flex-shrink-0">
                      <Image
                        src={userData.user_profile_img ? userData.user_profile_img : Img2}
                        alt="user-avatar"
                        className="user-avatar wid-35"
                        roundedCircle
                      />
                    </div>
                    <Stack gap={1}>
                      <h6 className="text-white mb-0">{userData.name} 🖖</h6>
                      <span className="text-white text-opacity-75">{userData.email}</span>
                    </Stack>
                  </Stack>
                </Dropdown.Header>

                <div className="dropdown-body">
                  <div className="profile-notification-scroll position-relative" style={{ maxHeight: 'calc(100vh - 225px)' }}>
                    <Dropdown.Item onClick={handleOpenModal} className="justify-content-start">
                      <i className="ph ph-gear me-2" />
                      Settings
                    </Dropdown.Item>
                    {/* <Dropdown.Item as={Link} to="#" className="justify-content-start">
                      <i className="ph ph-share-network me-2" />
                      Share
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="#" className="justify-content-start">
                      <i className="ph ph-lock-key me-2" />
                      Change Password
                    </Dropdown.Item> */}
                    <div className="d-grid my-2">
                      <Button onClick={handleLogout}>
                        <i className="ph ph-sign-out align-middle me-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </div>
      </div>
      {/* Settings / Profile Update Modal */}
      <Modal show={showModal} onHide={loading ? () => {} : handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!formErrors.name} required />
              <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phone_no"
                value={formData.phone_no}
                onChange={handleChange}
                isInvalid={!!formErrors.phone_no}
              />
              <Form.Control.Feedback type="invalid">{formErrors.phone_no}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                isInvalid={!!formErrors.date_of_birth}
              />
              <Form.Control.Feedback type="invalid">{formErrors.date_of_birth}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
              {formData.user_profile_img && (
                <div className="mt-2">
                  <Image src={formData.user_profile_img} alt="Preview" roundedCircle width={60} height={60} />
                </div>
              )}
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="primary" type="submit">
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    data Updating...
                  </>
                ) : (
                  'Save Changes'
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
    </header>
  );
}
