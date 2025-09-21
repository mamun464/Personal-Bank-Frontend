import { useEffect, useState } from 'react';
import { Card, Form, Button, Col, Row, Spinner, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';

import { uploadImage } from '../../utils/uploadImageBB';

// .meta.env variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function TransactionForm() {
  const token = localStorage.getItem('authkey');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const [document_url, setDocumentUrl] = useState('');
  const [IMGloading, setIMGLoading] = useState(false); // for file upload
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      customer: '',
      amount: '',
      transaction_type: '',
      payment_method: '',
      receipt_reference_no: '',
      document_photo_url: '',
      comment: '',
      date_of_transaction: today
    }
  });

  const transactionType = watch('transaction_type');
  const paymentMethod = watch('payment_method');
  // Determine allowed payment methods dynamically
  const getAllowedPaymentMethods = () => {
    if (transactionType === 'payment_out') {
      return ['wallet']; // case 1
    } else if (transactionType === 'deposit') {
      return ['cash', 'bank_transfer']; // case 2
    } else if (transactionType === 'withdrawal') {
      return ['cash', 'bank_transfer']; // case 3
    } else if (transactionType === '') {
      return []; // case 4
    } else {
      return ['cash', 'bank_transfer', 'wallet', 'other']; // fallback
    }
  };

  // Debounce input to avoid too many API calls
  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchUsers(query);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch users
  const fetchUsers = async (search) => {
    setLoadingUsers(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/user-api/user-list/?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setShowDropdown(true);
      } else {
        toast.error(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelect = (user) => {
    setShowDropdown(false);
    setValue('customer', user.id, { shouldValidate: true });
    setQuery(user.name);
  };

  // Reset dependent fields when parent changes
  useEffect(() => {
    // When transaction type changes, reset payment method and dependent fields
    setValue('payment_method', '');
    setValue('receipt_reference_no', '');
    setValue('document_photo_url', '');
    setDocumentUrl('');
  }, [transactionType, setValue]);

  useEffect(() => {
    // When payment method changes, reset dependent fields
    setValue('receipt_reference_no', '');
    setValue('document_photo_url', '');
    setDocumentUrl('');
  }, [paymentMethod, setValue]);

  const handleFileUpload = async (e) => {
    console.log('called handleFileUpload 4');

    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      toast.error('Invalid file type. Please select JPG or PNG.');
      return;
    }

    if (file.size > 300 * 1024) {
      toast.error('File size exceeds 300KB.');
      return;
    }

    setIMGLoading(true); // optional loading state

    const { upload_status, message, img_url } = await uploadImage(file);
    setIMGLoading(false);

    if (upload_status) {
      setDocumentUrl(img_url); // ✅ store the uploaded image URL
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // ✅ Replace document_photo_url with state value
      data.document_photo_url = document_url;
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }

      const res = await axios.post(`${BACKEND_URL}/wallet-api/transaction/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Transaction submitted successfully!');
        setValue('customer', '');
        setQuery('');
        setUsers([]);
        setShowDropdown(false);
        reset();
        setShowComment(false);
      } else {
        toast.error(res.data.message || 'Failed to submit transaction');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0 text-white fw-bold">Make New Transaction</h4>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>Customer</Form.Label>
              <Form.Control
                type="text"
                id="name"
                placeholder="Search by name or email or phone number"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setShowDropdown(true)}
                autoComplete="off"
                required
                // {...register('customer', { required: '*Customer is required' })}
                isInvalid={!!errors.customer}
              />
              {errors.customer && <Form.Control.Feedback type="invalid">{errors.customer.message}</Form.Control.Feedback>}

              {loadingUsers && <Spinner animation="border" size="sm" className="mt-1" />}

              {showDropdown && users.length > 0 && (
                <ListGroup
                  className="position-absolute w-50 shadow-sm bg-light"
                  style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                >
                  {users.map((user) => (
                    <ListGroup.Item
                      key={user.id}
                      className="py-1 small"
                      // Bootstrap does not provide a direct hover class for primary,
                      // so we use inline style for hover
                      onMouseEnter={(e) => e.currentTarget.classList.add('bg-info', 'text-white')}
                      onMouseLeave={(e) => e.currentTarget.classList.remove('bg-info', 'text-white')}
                      action
                      onClick={() => handleSelect(user)}
                    >
                      {user.name} ({user.email})
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                placeholder="Enter amount"
                {...register('amount', { required: '*Transaction amount is required' })}
                isInvalid={!!errors.amount}
              />
              {errors.amount && <small className="text-danger">{errors.amount.message}</small>}
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>Transaction Type</Form.Label>
              <Form.Select
                {...register('transaction_type', { required: '*Transaction Type is required*' })}
                isInvalid={!!errors.transaction_type}
              >
                <option value="">Select Transaction Type</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="payment_out">Payment Out</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.transaction_type?.message} {/* ✅ shows error message in red */}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Payment Method</Form.Label>
              <Form.Select {...register('payment_method', { required: '*Payment Method is required' })} isInvalid={!!errors.payment_method}>
                <option value="">Select Payment Method</option>
                {getAllowedPaymentMethods().map((method) => (
                  <option key={method} value={method}>
                    {method
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.payment_method?.message} {/* ✅ shows error message in red */}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          {(transactionType === 'deposit' && paymentMethod === 'bank_transfer') ||
          (transactionType === 'withdrawal' && paymentMethod === 'bank_transfer') ? (
            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label>Receipt Reference No</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter receipt reference"
                  {...register('receipt_reference_no', { required: '*Receipt reference number is required' })}
                  isInvalid={!!errors.receipt_reference_no} // ✅ adds red border if error
                />
                {errors.receipt_reference_no && <small className="text-danger">{errors.receipt_reference_no.message}</small>}
              </Form.Group>

              <Form.Group as={Col} md={6}>
                <Form.Label>Receipt Document</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  {...register('document_photo_url', {
                    required: '*Receipt reference document is required',
                    onChange: (e) => {
                      handleFileUpload(e); // ✅ your custom handler
                    }
                  })}
                  isInvalid={!!errors.document_photo_url}
                />
                <Form.Control.Feedback type="invalid">{errors.document_photo_url?.message}</Form.Control.Feedback>
              </Form.Group>
            </Row>
          ) : null}

          <Row>
            <Form.Group as={Col} md={6}>
              <Form.Label>Date of Transaction</Form.Label>
              <Form.Control type="date" {...register('date_of_transaction')} />
            </Form.Group>

            <Form.Group as={Col} md={6}>
              <Form.Label>Comment</Form.Label>
              <Form.Control as="textarea" rows={1} {...register('comment')} />
            </Form.Group>
          </Row>

          <Button className="mt-3" type="submit" variant="primary" disabled={submitting || loadingUsers || IMGloading}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" /> Submitting...
              </>
            ) : (
              'Submit Transaction'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
