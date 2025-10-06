import React, { useState } from 'react';
import { Settings, Edit3, Key, Phone, User, Mail, Save, X } from 'lucide-react';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const AccountSettings = ({ currentUser, userProfile, onLoadUserProfile }) => {
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [newPhone, setNewPhone] = useState(userProfile?.phoneNumber || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsUpdating(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: newName.trim()
      });

      // Update Firestore user document
      if (userProfile) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          displayName: newName.trim(),
          updatedAt: new Date()
        });
      }

      await onLoadUserProfile();
      setEditingName(false);
      toast.success('Name updated successfully');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePhone = async () => {
    setIsUpdating(true);
    try {
      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        phoneNumber: newPhone.trim(),
        updatedAt: new Date()
      });

      await onLoadUserProfile();
      setEditingPhone(false);
      toast.success('Phone number updated successfully');
    } catch (error) {
      console.error('Error updating phone:', error);
      toast.error('Failed to update phone number');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(currentUser.auth, currentUser.email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setIsSendingReset(false);
    }
  };

  const cancelNameEdit = () => {
    setNewName(currentUser?.displayName || '');
    setEditingName(false);
  };

  const cancelPhoneEdit = () => {
    setNewPhone(userProfile?.phoneNumber || '');
    setEditingPhone(false);
  };

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className="flex items-center space-x-3 mb-8">
                <Settings className="w-6 h-6 text-tufts-blue" />
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Account Settings</h2>
              </div>
              
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-eerie-black mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-cool-black">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-eerie-black">{currentUser.email}</span>
                        <span className="text-xs text-cool-black bg-gray-200 px-2 py-1 rounded">Verified</span>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-cool-black">
                        <User className="w-4 h-4 inline mr-2" />
                        Display Name
                      </label>
                      {editingName ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                            placeholder="Enter your name"
                          />
                          <button
                            onClick={handleUpdateName}
                            disabled={isUpdating}
                            className="p-3 bg-tufts-blue text-white rounded-lg hover:bg-cobalt-blue transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelNameEdit}
                            className="p-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-eerie-black">{currentUser.displayName || 'Not set'}</span>
                          <button
                            onClick={() => setEditingName(true)}
                            className="text-tufts-blue hover:text-cobalt-blue transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-cool-black">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      {editingPhone ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                            placeholder="Enter your phone number"
                          />
                          <button
                            onClick={handleUpdatePhone}
                            disabled={isUpdating}
                            className="p-3 bg-tufts-blue text-white rounded-lg hover:bg-cobalt-blue transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelPhoneEdit}
                            className="p-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-eerie-black">{userProfile?.phoneNumber || 'Not set'}</span>
                          <button
                            onClick={() => setEditingPhone(true)}
                            className="text-tufts-blue hover:text-cobalt-blue transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Account Info */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-cool-black">Account Created</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-eerie-black">
                          {userProfile?.createdAt ? 
                            (userProfile.createdAt.toDate ? 
                              new Date(userProfile.createdAt.toDate()).toLocaleDateString() :
                              new Date(userProfile.createdAt).toLocaleDateString()
                            ) : 
                            'Unknown'
                          }
                        </span>
                        {!userProfile?.createdAt && (
                          <button 
                            onClick={async () => {
                              console.log('Manual refresh triggered');
                              await onLoadUserProfile();
                            }}
                            className="ml-2 text-sm text-tufts-blue hover:text-cobalt-blue underline transition-colors"
                          >
                            Refresh
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h3 className="text-lg font-medium text-eerie-black mb-4">Security</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-cool-black">
                        <Key className="w-4 h-4 inline mr-2" />
                        Password
                      </label>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-eerie-black">••••••••</span>
                        <button
                          onClick={handlePasswordReset}
                          disabled={isSendingReset}
                          className="text-sm bg-tufts-blue text-white px-4 py-2 rounded-lg hover:bg-cobalt-blue transition-colors disabled:opacity-50"
                        >
                          {isSendingReset ? 'Sending...' : 'Reset Password'}
                        </button>
                      </div>
                      <p className="text-xs text-cool-black">
                        We'll send a password reset link to your email address
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-cool-black">Account Role</label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-eerie-black capitalize">{userProfile?.role || 'customer'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
        </div>
      </div>
    </section>
  );
};

export default AccountSettings;
