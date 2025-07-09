import React, { useState, useEffect } from 'react';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    showPassword: false,
  });

  // Load user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
        mobile: user.mobile || '',
        password: '', // Leave password empty for security
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setFormData((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`https://adminapp-1-nk19.onrender.com/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
        }),
      });

      if (!response.ok) throw new Error('Failed to update user');

      const updatedUser = await response.json();

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      alert('Changes saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error updating profile.');
    }
  };

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '30px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      backgroundColor: '#fff',
    },
    title: {
      textAlign: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    label: {
      fontWeight: 'bold',
      marginBottom: '5px',
      display: 'block',
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '15px',
      border: '1px solid #ccc',
      borderRadius: '6px',
      fontSize: '14px',
    },
    passwordWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    toggleIcon: {
      position: 'absolute',
      right: '10px',
      cursor: 'pointer',
    },
    button: {
      backgroundColor: '#fcd401',
      color: '#000',
      border: 'none',
      padding: '12px',
      width: '100%',
      fontWeight: 'bold',
      fontSize: '16px',
      borderRadius: '8px',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>Edit Profile</div>
      <form onSubmit={handleSubmit}>
        <label style={styles.label}>Full Name</label>
        <input
          style={styles.input}
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
        />

        <label style={styles.label}>Email Address</label>
        <input
          style={styles.input}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        <label style={styles.label}>Mobile Number</label>
        <input
          style={styles.input}
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
        />

        <label style={styles.label}>Password</label>
        <div style={styles.passwordWrapper}>
          <input
            style={styles.input}
            type={formData.showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <span onClick={togglePasswordVisibility} style={styles.toggleIcon}>
            {formData.showPassword ? '👁‍🗨' : '👁️'}
          </span>
        </div>

        <button type="submit" style={styles.button}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
