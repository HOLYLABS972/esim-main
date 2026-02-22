import React, { useState } from 'react';
import { Settings, Edit3, Key, Phone, User, Mail, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';
import { useI18n } from '../../contexts/I18nContext';

const AccountSettings = ({ currentUser, userProfile, onLoadUserProfile }) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [newPhone, setNewPhone] = useState(userProfile?.phoneNumber || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleUpdateName = async () => {
    if (!newName.trim()) { toast.error('Name cannot be empty'); return; }
    setIsUpdating(true);
    try {
      await supabase.from('user_profiles').update({ display_name: newName.trim(), updated_at: new Date().toISOString() }).eq('id', currentUser.uid);
      await onLoadUserProfile();
      setEditingName(false);
      toast.success('Name updated');
    } catch (e) { toast.error('Failed to update name'); }
    finally { setIsUpdating(false); }
  };

  const handleUpdatePhone = async () => {
    setIsUpdating(true);
    try {
      await supabase.from('user_profiles').update({ phone_number: newPhone.trim(), updated_at: new Date().toISOString() }).eq('id', currentUser.uid);
      await onLoadUserProfile();
      setEditingPhone(false);
      toast.success('Phone updated');
    } catch (e) { toast.error('Failed to update phone'); }
    finally { setIsUpdating(false); }
  };

  const handlePasswordReset = async () => {
    setIsSendingReset(true);
    try {
      await supabase.auth.resetPasswordForEmail(currentUser.email);
      toast.success('Reset email sent!');
    } catch (e) { toast.error('Failed to send reset email'); }
    finally { setIsSendingReset(false); }
  };

  return (
    <section className="bg-white py-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-3"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">
              {t('dashboard.accountSettings', 'Account Settings')}
            </h2>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {isExpanded && (
          <div className="space-y-4 pb-4">
            {/* Email */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{currentUser.email}</span>
                <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Verified</span>
              </div>
            </div>

            {/* Name */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5" /> Display Name
              </label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                    placeholder="Enter name" />
                  <button onClick={handleUpdateName} disabled={isUpdating}
                    className="p-2.5 bg-tufts-blue text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /></button>
                  <button onClick={() => { setNewName(currentUser?.displayName || ''); setEditingName(false); }}
                    className="p-2.5 bg-gray-200 text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{currentUser.displayName || 'Not set'}</span>
                  <button onClick={() => setEditingName(true)} className="text-tufts-blue"><Edit3 className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-2">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              {editingPhone ? (
                <div className="flex items-center gap-2">
                  <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                    className="flex-1 p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                    placeholder="Enter phone" />
                  <button onClick={handleUpdatePhone} disabled={isUpdating}
                    className="p-2.5 bg-tufts-blue text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /></button>
                  <button onClick={() => { setNewPhone(userProfile?.phoneNumber || ''); setEditingPhone(false); }}
                    className="p-2.5 bg-gray-200 text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{userProfile?.phoneNumber || 'Not set'}</span>
                  <button onClick={() => setEditingPhone(true)} className="text-tufts-blue"><Edit3 className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            {/* Password Reset */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-2">
                <Key className="w-3.5 h-3.5" /> Password
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900">••••••••</span>
                <button onClick={handlePasswordReset} disabled={isSendingReset}
                  className="text-xs bg-tufts-blue text-white px-3 py-1.5 rounded-lg hover:bg-tufts-blue-dark transition-colors disabled:opacity-50">
                  {isSendingReset ? 'Sending...' : 'Reset'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AccountSettings;
