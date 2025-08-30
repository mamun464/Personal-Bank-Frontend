export const emailSchema = {
  required: 'Email is required',
  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
};

export const passwordSchema = {
  required: 'Password is required',
  minLength: { value: 6, message: 'Password must be at least 6 characters' }
};

export const confirmPasswordSchema = {
  required: 'Confirm Password is required',
  minLength: { value: 6, message: 'Password must be at least 6 characters' }
};

export const firstNameSchema = {
  required: 'First name is required',
  pattern: { value: /^[a-zA-Z\s]+$/, message: 'Invalid first name' }
};

export const fullNameSchema = {
  required: 'Name is required',
  pattern: { value: /^[a-zA-Z\s]+$/, message: 'Name should contain only letters and spaces' }
};

export const lastNameSchema = {
  required: 'Last name is required',
  pattern: { value: /^[a-zA-Z\s]+$/, message: 'Invalid last name' }
};

export const phoneNumberSchema = {
  required: 'Phone Number is required',
  pattern: {
    value: /^\+[0-9]{10,15}$/,
    message: 'Invalid Phone Number, must be in the format +8801767213613'
  }
};
export const dateOfBirthSchema = {
  required: 'Date Of Birth is required',
  validate: {
    ageMustBeAtLeast14: (value) => {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear(); // ✅ Changed to let
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 14) {
        return 'Age must be at least 15 years old';
      }
      return true;
    }

  }
};
