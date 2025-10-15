import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/profile.css"; // Ensure this CSS file exists and is styled as needed

// Simple Eye Icons
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

// Update UserData interface to include address
interface UserData {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone_number?: string;
  address?: string;
  [key: string]: any; // Allow for other properties
}

// Define type for password errors
interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state for form submission

  // Form fields state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Add state for address
  const [address, setAddress] = useState("");

  // Profile form error states
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [addressError, setAddressError] = useState(""); // New state for address error

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");

  // Password visibility states
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Redirect to signin if not authenticated
  const accessToken = localStorage.getItem("accessToken");
  useEffect(() => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    fetch("http://127.0.0.1:8000/api/user/profile/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setFirstName(data.user.first_name || "");
          setLastName(data.user.last_name || "");
          setPhoneNumber(data.phone_number || "");
          setAddress(data.address || ""); // Set address from API response
        } else {
          navigate("/signin");
        }
      })
      .catch(() => {
        navigate("/signin");
      });
  }, [navigate, accessToken]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string>>, 
    errorSetter?: React.Dispatch<React.SetStateAction<string>>
  ) => {
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

  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { 
      setPhoneNumber(value);
      setPhoneNumberError(""); 
    } else {
      setPhoneNumberError("Phone number can only contain digits.");
    }
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    let errors: Record<string, string> = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();
    const trimmedAddress = address.trim();

    if (!trimmedFirstName) {
      errors.firstName = "First name is required.";
    }
    if (!trimmedLastName) {
      errors.lastName = "Last name is required.";
    }
    if (!trimmedPhoneNumber) {
      errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(trimmedPhoneNumber)) {
      errors.phoneNumber = "Phone number can only contain digits.";
    } else if (trimmedPhoneNumber.length < 10) {
      errors.phoneNumber = "Phone number must be at least 10 digits long.";
    }
    if (!trimmedAddress) {
      errors.address = "Address is required.";
    }

    setFirstNameError(errors.firstName || "");
    setLastNameError(errors.lastName || "");
    setPhoneNumberError(errors.phoneNumber || "");
    setAddressError(errors.address || "");

    if (Object.keys(errors).some(key => errors[key])) {
      return;
    }

    try {
      setIsSubmitting(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        navigate("/signin");
        return;
      }

      // Send PUT request with exact API expected format
      const response = await fetch("http://127.0.0.1:8000/api/user/profile/", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: {
            first_name: trimmedFirstName,
            last_name: trimmedLastName
          },
          address: trimmedAddress,
          phone_number: trimmedPhoneNumber
        })
      });

      if (response.ok) {
        const updatedData = await response.json();
        
        // Update user state with new data from server response
        setUser({
          ...user,
          first_name: trimmedFirstName,
          last_name: trimmedLastName
        });
        // Update the other fields outside user object
        setPhoneNumber(trimmedPhoneNumber);
        setAddress(trimmedAddress);
        
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        const errorData = await response.json();
        if (errorData.user?.first_name) {
          setFirstNameError(errorData.user.first_name[0]);
        }
        if (errorData.user?.last_name) {
          setLastNameError(errorData.user.last_name[0]);
        }
        if (errorData.phone_number) {
          setPhoneNumberError(errorData.phone_number[0]);
        }
        if (errorData.address) {
          setAddressError(errorData.address[0]);
        }
        if (errorData.detail) {
          alert(`Error: ${errorData.detail}`);
        }
      }
    } catch (error) {
      alert("Failed to update profile. Please try again later.");
      console.error("Profile update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
    setPasswordSuccessMessage("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
  };

  const handleChangePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccessMessage("");
    let errors: PasswordErrors = {};

    if (!user) { 
      console.error("User data not available for password change.");
      return;
    }

    if (!currentPassword) {
        errors.currentPassword = "Current password is required.";
    }
    if (!newPassword) {
        errors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
        errors.newPassword = "New password must be at least 6 characters long.";
    }
    if (!confirmPassword) {
        errors.confirmPassword = "Confirm new password is required.";
    } else if (newPassword && newPassword !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Call backend API to change password
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch("http://127.0.0.1:8000/api/user/change-password/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccessMessage(data.message || "Password changed successfully!");
        setTimeout(() => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          closeChangePasswordModal();
        }, 2000);
      } else {
        setPasswordErrors({
          currentPassword: data.old_password || data.detail || "Current password is incorrect.",
          newPassword: data.new_password,
        });
      }
    } catch {
      setPasswordErrors({ currentPassword: "Failed to change password. Please try again." });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFirstName(user.firstName || user.first_name || "");
      setLastName(user.lastName || user.last_name || "");
      setPhoneNumber(user.phoneNumber || user.phone_number || "");
      setAddress(user.address || "");
    }
    setFirstNameError("");
    setLastNameError("");
    setPhoneNumberError("");
    setAddressError("");
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading profile...</p></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-4 md:p-8">
        <div className="bg-white shadow-xl p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Personal Info</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your personal information.</p>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <button
                onClick={openChangePasswordModal}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 text-sm rounded-lg transition duration-150"
              >
                Change Password
              </button>
              
            </div>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">*Email cannot be changed.</p>
            </div>

            {/* Add address field */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={address}
                onChange={(e) => handleInputChange(e, setAddress, setAddressError)}
                disabled={!isEditing}
                required={isEditing} 
                className={`mt-1 block w-full px-3 py-2 border ${addressError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {addressError && <p className="mt-1 text-xs text-red-600">{addressError}</p>}
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(e) => handleInputChange(e, setFirstName, setFirstNameError)}
                disabled={!isEditing}
                required={isEditing} 
                className={`mt-1 block w-full px-3 py-2 border ${firstNameError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {firstNameError && <p className="mt-1 text-xs text-red-600">{firstNameError}</p>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => handleInputChange(e, setLastName, setLastNameError)}
                disabled={!isEditing}
                required={isEditing}
                className={`mt-1 block w-full px-3 py-2 border ${lastNameError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {lastNameError && <p className="mt-1 text-xs text-red-600">{lastNameError}</p>}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                inputMode="numeric"
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneNumberChange} 
                disabled={!isEditing}
                required={isEditing}
                placeholder="e.g., 1234567890 (min 10 digits)"
                maxLength={15} 
                className={`mt-1 block w-full px-3 py-2 border ${phoneNumberError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {phoneNumberError && <p className="mt-1 text-xs text-red-600">{phoneNumberError}</p>}
            </div>

            <div className="pt-2">
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    disabled={isSubmitting}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setIsEditing(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium">
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </main>

      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
              <button onClick={closeChangePasswordModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            {passwordSuccessMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">
                    {passwordSuccessMessage}
                </div>
            )}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPasswordModal" className="block text-sm font-medium text-gray-700">Current Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    id="currentPasswordModal" 
                    name="currentPassword"
                    value={currentPassword}
                    onChange={(e) => handleInputChange(e, setCurrentPassword, undefined)}
                    required 
                    className={`block w-full px-3 py-2 pr-10 border ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showCurrentPw ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPw ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                {passwordErrors.currentPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>}
              </div>

              <div>
                <label htmlFor="newPasswordModal" className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showNewPw ? "text" : "password"}
                    id="newPasswordModal"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => handleInputChange(e, setNewPassword, undefined)}
                    required
                    className={`block w-full px-3 py-2 pr-10 border ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showNewPw ? "Hide new password" : "Show new password"}
                    >
                      {showNewPw ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>}
              </div>

              <div>
                <label htmlFor="confirmPasswordModal" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    id="confirmPasswordModal"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => handleInputChange(e, setConfirmPassword, undefined)}
                    required
                    className={`block w-full px-3 py-2 pr-10 border ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPw ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeChangePasswordModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;