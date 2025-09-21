// utils/uploadImage.js
export const uploadImage = async (file) => {
  // Replace these with your actual values
  const IMG_BB_API_KEY = import.meta.env.VITE_IMG_BB_API_KEY;
  const IMG_BB_API_URL = import.meta.env.VITE_IMG_BB_API_URL;

  if (!file) {
    return { upload_status: false, message: 'No file provided', img_url: null };
  }

  // Allowed file extensions and size check
  const allowedExtensions = ['jpg', 'jpeg', 'png'];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    return { upload_status: false, message: 'Invalid file type. Please select JPG or PNG.', img_url: null };
  }

  if (file.size > 300 * 1024) {
    return { upload_status: false, message: 'File size exceeds 300KB.', img_url: null };
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${IMG_BB_API_URL}?key=${IMG_BB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data?.success) {
      return { upload_status: true, message: 'Image successfully uploaded!', img_url: data.data.url };
    } else if (data?.status === 401) {
      return { upload_status: false, message: 'Unauthorized. Please log in again.', img_url: null };
    } else {
      return { upload_status: false, message: data?.error?.message || 'Upload failed', img_url: null };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return { upload_status: false, message: 'Something went wrong during upload.', img_url: null };
  }
};
