import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/profile.css"; // Ensure this CSS file exists and is styled as needed

// Simple Eye Icons (same as user profile)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const AdminProfile = () => { // Renamed component
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
      navigate("/signin");
    } else {
        // Add admin specific check if needed, e.g. redirect if not admin
        // if (loggedInUser.email !== "admin@gmail.com") { navigate('/home'); return; }
      setUser(loggedInUser);
      setFirstName(loggedInUser.firstName || "");
      setLastName(loggedInUser.lastName || "");
      setPhoneNumber(loggedInUser.phoneNumber || "");
    }
  }, [navigate]);

  const handleInputChange = (e, setter, errorSetter) => {
    setter(e.target.value);
    if (errorSetter) {
      errorSetter("");
    }
    if (showChangePasswordModal &&
        (e.target.name === "currentPassword" || e.target.name === "newPassword" || e.target.name === "confirmPassword")) {
        setPasswordSuccessMessage("");
        setPasswordErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPhoneNumber(value);
      setPhoneNumberError("");
    } else {
      setPhoneNumberError("Phone number can only contain digits.");
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!user) return;

    let errors = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!trimmedFirstName) errors.firstName = "First name is required.";
    if (!trimmedLastName) errors.lastName = "Last name is required.";
    if (!trimmedPhoneNumber) {
      errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(trimmedPhoneNumber)) {
      errors.phoneNumber = "Phone number can only contain digits.";
    } else if (trimmedPhoneNumber.length < 10) {
      errors.phoneNumber = "Phone number must be at least 10 digits long.";
    }

    setFirstNameError(errors.firstName || "");
    setLastNameError(errors.lastName || "");
    setPhoneNumberError(errors.phoneNumber || "");

    if (Object.keys(errors).some(key => errors[key])) return;

    const updatedUser = {
      ...user,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      phoneNumber: trimmedPhoneNumber,
    };

    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    const allUsers = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = allUsers.findIndex(u => u.email === updatedUser.email);
    if (userIndex !== -1) {
      allUsers[userIndex] = {...allUsers[userIndex], ...updatedUser};
      localStorage.setItem("users", JSON.stringify(allUsers));
    }
    setUser(updatedUser);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
    navigate("/signin");
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPasswordErrors({}); setPasswordSuccessMessage("");
    setShowCurrentPw(false); setShowNewPw(false); setShowConfirmPw(false);
  };

  const closeChangePasswordModal = () => setShowChangePasswordModal(false);

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordErrors({}); setPasswordSuccessMessage("");
    let errors = {};
    if (!user) return;

    if (!currentPassword) errors.currentPassword = "Current password is required.";
    else if (user.password !== currentPassword) errors.currentPassword = "Incorrect current password.";

    if (!newPassword) errors.newPassword = "New password is required.";
    else if (newPassword.length < 6) errors.newPassword = "New password must be at least 6 characters long.";
    else if (newPassword === currentPassword && !errors.currentPassword) {
        const samePasswordError = "New password cannot be the same as the current password.";
        errors.newPassword = errors.newPassword ? `${errors.newPassword} ${samePasswordError}` : samePasswordError;
    }

    if (!confirmPassword) errors.confirmPassword = "Confirm new password is required.";
    else if (newPassword && newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const updatedUserWithNewPassword = {
      ...user, password: newPassword,
      firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: phoneNumber.trim(),
    };
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUserWithNewPassword));
    const allUsers = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = allUsers.findIndex(u => u.email === user.email);
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUserWithNewPassword;
      localStorage.setItem("users", JSON.stringify(allUsers));
    }
    setUser(updatedUserWithNewPassword);
    setPasswordSuccessMessage("Password changed successfully!");
    setTimeout(() => {
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      closeChangePasswordModal();
    }, 2000);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFirstName(user.firstName || ""); setLastName(user.lastName || ""); setPhoneNumber(user.phoneNumber || "");
    setFirstNameError(""); setLastNameError(""); setPhoneNumberError("");
  }

  if (!user) return <div className="flex justify-center items-center min-h-screen"><p>Loading admin profile...</p></div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-4 md:p-8">
        <div className="bg-white shadow-xl p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Personal Info</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your admin information.</p>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <button onClick={openChangePasswordModal} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 text-sm rounded-lg transition duration-150">Change Password</button>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm rounded-lg transition duration-150">Logout</button>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" id="adminEmail" value={user.email} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed focus:outline-none sm:text-sm" />
              <p className="mt-1 text-xs text-gray-500">*Email cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="adminFirstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" id="adminFirstName" name="firstName" value={firstName} onChange={(e) => handleInputChange(e, setFirstName, setFirstNameError)} disabled={!isEditing} required={isEditing} className={`mt-1 block w-full px-3 py-2 border ${firstNameError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none sm:text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} />
              {firstNameError && <p className="mt-1 text-xs text-red-600">{firstNameError}</p>}
            </div>
            <div>
              <label htmlFor="adminLastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" id="adminLastName" name="lastName" value={lastName} onChange={(e) => handleInputChange(e, setLastName, setLastNameError)} disabled={!isEditing} required={isEditing} className={`mt-1 block w-full px-3 py-2 border ${lastNameError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none sm:text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} />
              {lastNameError && <p className="mt-1 text-xs text-red-600">{lastNameError}</p>}
            </div>
            <div>
              <label htmlFor="adminPhoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="text" inputMode="numeric" id="adminPhoneNumber" name="phoneNumber" value={phoneNumber} onChange={handlePhoneNumberChange} disabled={!isEditing} required={isEditing} placeholder="e.g., 1234567890 (min 10 digits)" maxLength={15} className={`mt-1 block w-full px-3 py-2 border ${phoneNumberError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none sm:text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} />
              {phoneNumberError && <p className="mt-1 text-xs text-red-600">{phoneNumberError}</p>}
            </div>
            <div className="pt-2">
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium">Save Changes</button>
                  <button type="button" onClick={cancelEdit} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setIsEditing(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium">Edit Profile</button>
              )}
            </div>
          </form>
        </div>
      </main>
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
              <button onClick={closeChangePasswordModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            {passwordSuccessMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{passwordSuccessMessage}</div>}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="adminCurrentPasswordModal" className="block text-sm font-medium text-gray-700">Current Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input type={showCurrentPw ? "text" : "password"} id="adminCurrentPasswordModal" name="currentPassword" value={currentPassword} onChange={(e) => handleInputChange(e, setCurrentPassword)} required className={`block w-full px-3 py-2 pr-10 border ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none sm:text-sm`} />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-gray-500 hover:text-gray-700 focus:outline-none">{showCurrentPw ? <EyeSlashIcon /> : <EyeIcon />}</button></div>
                </div>
                {passwordErrors.currentPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>}
              </div>
              <div>
                <label htmlFor="adminNewPasswordModal" className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input type={showNewPw ? "text" : "password"} id="adminNewPasswordModal" name="newPassword" value={newPassword} onChange={(e) => handleInputChange(e, setNewPassword)} required className={`block w-full px-3 py-2 pr-10 border ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none sm:text-sm`} />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-gray-500 hover:text-gray-700 focus:outline-none">{showNewPw ? <EyeSlashIcon /> : <EyeIcon />}</button></div>
                </div>
                {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>}
              </div>
              <div>
                <label htmlFor="adminConfirmPasswordModal" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input type={showConfirmPw ? "text" : "password"} id="adminConfirmPasswordModal" name="confirmPassword" value={confirmPassword} onChange={(e) => handleInputChange(e, setConfirmPassword)} required className={`block w-full px-3 py-2 pr-10 border ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none sm:text-sm`} />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-gray-500 hover:text-gray-700 focus:outline-none">{showConfirmPw ? <EyeSlashIcon /> : <EyeIcon />}</button></div>
                </div>
                {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>}
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={closeChangePasswordModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile; // Export AdminProfile