{/*// ProfileSettingsPage.js
import React, { useState, useRef } from 'react';

import '../../css/profile.css';
import '../../css/socialMedia.css';
import '../../css/uploadpic.css';

const ProfileSettingsPage = () => {
  const [optOut, setOptOut] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [pinterest, setPinterest] = useState('');
  const [x, setX] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setDisplayName('');
    setTagline('');
    setFacebook('');
    setInstagram('');
    setWebsite('');
    setPinterest('');
    setX('');
    setSelectedImage(null);
  };

  const handleSubmit = (event:any) => {
    event.preventDefault();
    console.log('Saving changes:', {
      optOut,
      displayName,
      tagline,
      facebook,
      instagram,
      website,
      pinterest,
      x,
      selectedImage,
    });
    setIsEditing(false);
  };

  const handleInputChange = (event:any, setter:any) => {
    setter(event.target.value);
  };

  const handleImageChange = (event:any) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(URL.createObjectURL(event.target.files[0]));
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteClick = () => {
    setSelectedImage(null);
  };

  return (
    <div className="profile-settings-full">

           
      <div className="main-content">
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <form onSubmit={handleSubmit} className="mt-4">
            <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>

            <div className="opt-out-info">
              <span role="img" aria-label="lock">🔒</span> Only you will be able to see the information on this page because you opted out of having a profile
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">About Me</h3>
              <div className="about-me-content">
                <div className="display-name">
                  <label htmlFor="displayName">Display Name*</label>
                  <input
                    type="text"
                    id="displayName"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => handleInputChange(e, setDisplayName)}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                <div className="profile-photo-container">
                  <label htmlFor="file" className="profile-photo-label" onClick={handleUploadClick}>
                    {selectedImage ? (
                      <div className="image-container">
                        <div className="circular-frame">
                          <img src={selectedImage} alt="Profile" className="profile-image" />
                        </div>
                        <span className="profile-photo-text">Profile Photo</span>
                        <button type="button" className="delete-button oval-button" onClick={handleDeleteClick}>
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="placeholder-content">
                        <div className="circular-placeholder">
                          <span role="img" aria-label="add-image" className="plus-icon">
                            ➕
                          </span>
                        </div>
                        <span className="profile-photo-text">Profile Photo</span>
                      </div>
                    )}
                  </label>
                  <input
                    type="file"
                    id="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                     disabled={!isEditing}
                    className="input"
                  />
                </div>

                <div className="tagline">
                  <label htmlFor="tagline">Tagline</label>
                  <textarea
                    id="tagline"
                    placeholder="This is you in a nutshell (unless you are allergic to nuts)"
                    value={tagline}
                    onChange={(e) => handleInputChange(e, setTagline)}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
              </div>
            </div>
            <div className="social-media-accounts">
              <div className="accounts-grid">
                <div className="account-pair">
                  <label htmlFor="facebook">Facebook</label>
                  <input
                    type="text"
                    id="facebook"
                    placeholder="Your Facebook handle"
                    value={facebook}
                    onChange={(e) => handleInputChange(e, setFacebook)}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                <div className="account-pair">
                  <label htmlFor="instagram">Instagram</label>
                  <input
                    type="text"
                    id="instagram"
                    placeholder="Your Instagram handle"
                    value={instagram}
                    onChange={(e) => handleInputChange(e, setInstagram)}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                <div className="account-pair">
                  <label htmlFor="website">Personal Website/Blog</label>
                  <input
                    type="text"
                    id="website"
                    placeholder="Your Personal Website/Blog handle"
                    value={website}
                    onChange={(e) => handleInputChange(e, setWebsite)}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                <div className="account-pair">
                  <label htmlFor="pinterest">Pinterest</label>
                  <input
                    type="text"
                    id="pinterest"
                    placeholder="Your Pinterest handle"
                    value={pinterest}
                    onChange={(e) => handleInputChange(e, setPinterest)}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                <div className="account-pair">
                  <label htmlFor="x">X</label>
                  <input
                    type="text"
                    id="x"
                    placeholder="Your X handle"
                    value={x}
                    onChange={(e) => handleInputChange(e, setX)}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </form>
          {isEditing ? (
            <div className="flex space-x-4 mt-4">
              <button
                type="button"
                className="btn bg-green-500 hover:bg-green-600"
                onClick={handleSubmit}
              >
                SAVE CHANGES
              </button>
              <button
                type="button"
                className="btn bg-gray-400 hover:bg-gray-500"
                onClick={handleCancelClick}
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn bg-blue-500 hover:bg-blue-600 mt-4"
              onClick={handleEditClick}
            >
              EDIT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;*/}