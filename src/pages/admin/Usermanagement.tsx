import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../css/profile.css';
import '../../css/usermanagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'sankalpa', email: 'sankalpa@example.com' },
    { id: 2, name: 'khushi', email: 'khushi@example.com' },
  ]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [editingUser, setEditingUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetSetter: (val: any) => void,
    current: any
  ) => {
    const { name, value } = e.target;
    targetSetter({ ...current, [name]: value });
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (user: { name: string; email: string }) => {
    const errors: { name?: string; email?: string } = {};
    if (!user.name.trim()) errors.name = "Name is required";
    if (!user.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(user.email)) {
      errors.email = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm(newUser)) {
      const createdUser = {
        id: Date.now(),
        name: newUser.name.trim(),
        email: newUser.email.trim(),
      };
      setUsers(prev => [createdUser, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      setNewUser({ name: '', email: '' });
    }
  };

  const deleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const startUpdateUser = (user: { id: number; name: string; email: string }) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
    setFormErrors({});
  };

  const updateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && validateForm(editingUser)) {
      setUsers(prev =>
        prev.map(user =>
          user.id === editingUser.id
            ? { ...editingUser, name: editingUser.name.trim(), email: editingUser.email.trim() }
            : user
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingUser(null);
      setShowEditModal(false);
    }
  };

  const cancelUpdate = () => {
    setEditingUser(null);
    setShowEditModal(false);
    setFormErrors({});
  };

  return (
    <div className="manage-users-page">
     
     
                 <aside className="w-64 bg-white shadow-md p-5">
                   <h2 className="text-lg font-bold mb-4">Settings</h2>
                   <ul className="space-y-3">
     
              <li><Link to="/Admin/Profile" className="block p-2 hover:bg-pink-100 rounded">Profile</Link></li>
               <li><Link to="/Admin/PublicPage" className="block p-2 hover:bg-pink-100 rounded">Public Profile</Link></li>
               <li><Link to="/Admin/UserManagement" className="block p-2 hover:bg-pink-100 rounded">User Management</Link></li>
               <li><Link to="/Admin/SavedPage" className="block p-2 hover:bg-pink-100 rounded">Saved Recipes</Link></li>
               <li><Link to="/Admin/AddRecipe" className="block p-2 hover:bg-pink-100 rounded">Add Recipe</Link></li>
               <li><Link to ="/Admin/VideoManagement" className="block p-2 hover:bg-pink-100 rounded"> Video management</Link></li>
                    
     
                     </ul>
                 </aside>
      <main className="manage-users-main-content">
        <div className="manage-users-header">
          <h1 className="manage-users-title">Manage Users</h1>
        </div>

        <form onSubmit={createUser} className="add-user-form">
          <b>Add New User</b>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newUser.name}
              onChange={e => handleInputChange(e, setNewUser, newUser)}
              className="form-input"
              placeholder="Enter user name"
            />
            {formErrors.name && <p className="error-message">{formErrors.name}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={newUser.email}
              onChange={e => handleInputChange(e, setNewUser, newUser)}
              className="form-input"
              placeholder="Enter user email"
            />
            {formErrors.email && <p className="error-message">{formErrors.email}</p>}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-success">Add User</button>
          </div>
        </form>

        <div className="user-list-container">
          <b>Current Users</b>
          {users.length === 0 ? (
            <p className="no-users-message">No users found. Add a user using the form above.</p>
          ) : (
            <div className="user-list">
              {users.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <div className="user-info-item">
                      <span className="user-info-label">Name:</span>
                      <span className="user-info-value">{user.name}</span>
                    </div>
                    <div className="user-info-item">
                      <span className="user-info-label">Email:</span>
                      <span className="user-info-value">{user.email}</span>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button onClick={() => startUpdateUser(user)} className="btn btn-warning">Edit</button>
                    <button onClick={() => deleteUser(user.id)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={cancelUpdate}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit User</h3>
            <form onSubmit={updateUser}>
              <div className="form-group">
                <label htmlFor="editName" className="form-label">Name:</label>
                <input
                  type="text"
                  id="editName"
                  name="name"
                  value={editingUser.name}
                  onChange={e => handleInputChange(e, setEditingUser, editingUser)}
                  className="form-input"
                />
                {formErrors.name && <p className="error-message">{formErrors.name}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="editEmail" className="form-label">Email:</label>
                <input
                  type="email"
                  id="editEmail"
                  name="email"
                  value={editingUser.email}
                  onChange={e => handleInputChange(e, setEditingUser, editingUser)}
                  className="form-input"
                />
                {formErrors.email && <p className="error-message">{formErrors.email}</p>}
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-success ">Update User</button>
                <button type="button" className="btn btn-danger" onClick={cancelUpdate}>Cancel</button>
              </div>
            </form>
            <button type="button" className="modal-close-btn" onClick={cancelUpdate}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
