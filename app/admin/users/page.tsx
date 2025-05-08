// app/admin/users/page.tsx (or your chosen path)
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // For client-side navigation if needed
import { listAllUsers, adminCreateUser, adminUpdateUser, adminDeleteUser, checkAdminAuth } from './_actions'; // Adjust path if needed
import { Edit3, Trash2, UserPlus, XCircle, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';

export const runtime = 'edge';

// Type for user data from Supabase Admin API
interface SupaAdminUser {
  id: string;
  email?: string | undefined;
  phone?: string | undefined;
  user_metadata?: { [key: string]: any };
  app_metadata?: { [key: string]: any };
  created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | undefined | null;
  phone_confirmed_at?: string | undefined | null;
}

// Type for form data when creating/editing
interface UserFormData {
  email?: string;
  password?: string;
  phone?: string;
  user_metadata_str?: string; // For textarea input (JSON string)
  app_metadata_str?: string;  // For textarea input (JSON string)
  email_confirm?: boolean;
  phone_confirm?: boolean;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<SupaAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [currentUser, setCurrentUser] = useState<SupaAdminUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({});
  const [actionLoading, setActionLoading] = useState(false); // For modal submit/delete loading

  const router = useRouter();

  // Initial auth check and user fetching
  useEffect(() => {
    async function performAuthCheckAndLoad() {
      setIsLoading(true);
      const authResult = await checkAdminAuth();
      if (authResult.isAdmin) {
        setIsAuthorized(true);
        await fetchUsers();
      } else {
        setIsAuthorized(false);
        setFeedback({ type: 'error', message: authResult.error || "You are not authorized to view this page." });
        // Optionally redirect: router.push('/sign-in');
      }
      setAuthCheckCompleted(true);
      setIsLoading(false);
    }
    performAuthCheckAndLoad();
  }, []);

  async function fetchUsers(showLoading = true) {
    if (!isAuthorized && authCheckCompleted) return; // Don't fetch if not authorized
    if(showLoading) setIsLoading(true);
    setFeedback(null);
    try {
      const result = await listAllUsers();
      if (result.error) {
        setFeedback({ type: 'error', message: result.error.message || 'Failed to fetch users.' });
        setUsers([]);
      } else {
        setUsers(result.data?.users || []);
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'An unexpected error occurred while fetching users.' });
      setUsers([]);
    }
    if(showLoading) setIsLoading(false);
  }

  const clearFeedback = () => setFeedback(null);

  const handleOpenCreateModal = () => {
    clearFeedback();
    setCurrentUser(null);
    setFormData({ email: '', password: '', phone: '', user_metadata_str: '{}', app_metadata_str: '{}', email_confirm: false, phone_confirm: false });
    setShowPassword(false);
    setShowModal('create');
  };

  const handleOpenEditModal = (user: SupaAdminUser) => {
    clearFeedback();
    setCurrentUser(user);
    setFormData({
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Password is not pre-filled for editing
      user_metadata_str: JSON.stringify(user.user_metadata || {}, null, 2),
      app_metadata_str: JSON.stringify(user.app_metadata || {}, null, 2),
      email_confirm: !!user.email_confirmed_at,
      phone_confirm: !!user.phone_confirmed_at,
    });
    setShowPassword(false);
    setShowModal('edit');
  };

  const handleOpenDeleteConfirm = (user: SupaAdminUser) => {
    clearFeedback();
    setCurrentUser(user);
    setShowDeleteConfirm(true);
  };

  const closeModal = () => {
    setShowModal(null);
    setShowDeleteConfirm(false);
    setCurrentUser(null);
    setActionLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const parseMetadata = (str: string | undefined, fieldName: string): object | undefined => {
    if (!str || str.trim() === '') return undefined; // Return undefined if empty to avoid sending empty objects
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed !== 'object' || parsed === null) {
         throw new Error("Metadata must be a JSON object.");
      }
      return parsed;
    } catch (e) {
      setFeedback({type: 'error', message: `Invalid JSON in ${fieldName}: ${(e as Error).message}`});
      throw e;
    }
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setActionLoading(true);

    let user_metadata: object | undefined;
    let app_metadata: object | undefined;

    try {
      user_metadata = parseMetadata(formData.user_metadata_str, 'User Metadata');
      app_metadata = parseMetadata(formData.app_metadata_str, 'App Metadata');
    } catch {
      setActionLoading(false);
      return; // Stop if metadata parsing failed
    }

    const attributes: any = {
      email: formData.email,
      phone: formData.phone || undefined, // Send undefined if empty
      user_metadata,
      app_metadata,
      email_confirm: formData.email_confirm,
      phone_confirm: formData.phone ? formData.phone_confirm : undefined, // Only send if phone is present
    };

    if (formData.password) {
      attributes.password = formData.password;
    }


    if (showModal === 'create') {
      if (!formData.email || !formData.password) {
        setFeedback({ type: 'error', message: "Email and Password are required for new users." });
        setActionLoading(false);
        return;
      }
      const result = await adminCreateUser(attributes);
      if (result.error) {
        setFeedback({ type: 'error', message: result.error.message || 'Failed to create user.' });
      } else {
        setFeedback({ type: 'success', message: `User ${result.data?.user?.email || ''} created successfully.` });
        await fetchUsers(false);
        closeModal();
      }
    } else if (showModal === 'edit' && currentUser) {
      // For updates, only send attributes that have changed or are explicitly part of the form
      const updateAttributes: any = {};
      if (attributes.email !== currentUser.email) updateAttributes.email = attributes.email;
      if (attributes.phone !== (currentUser.phone || undefined)) updateAttributes.phone = attributes.phone;
      if (attributes.password) updateAttributes.password = attributes.password; // If password is provided, update it
      if (JSON.stringify(attributes.user_metadata) !== JSON.stringify(currentUser.user_metadata || {})) updateAttributes.user_metadata = attributes.user_metadata;
      if (JSON.stringify(attributes.app_metadata) !== JSON.stringify(currentUser.app_metadata || {})) updateAttributes.app_metadata = attributes.app_metadata;
      if (attributes.email_confirm !== !!currentUser.email_confirmed_at) updateAttributes.email_confirm = attributes.email_confirm;
      if (attributes.phone_confirm !== !!currentUser.phone_confirmed_at && attributes.phone) updateAttributes.phone_confirm = attributes.phone_confirm;


      if (Object.keys(updateAttributes).length === 0) {
        setFeedback({ type: 'success', message: 'No changes detected.'})
        setActionLoading(false);
        return;
      }


      const result = await adminUpdateUser(currentUser.id, updateAttributes);
      if (result.error) {
        setFeedback({ type: 'error', message: result.error.message || 'Failed to update user.' });
      } else {
        setFeedback({ type: 'success', message: `User ${result.data?.user?.email || currentUser.email} updated successfully.` });
        await fetchUsers(false);
        closeModal();
      }
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async () => {
    clearFeedback();
    if (!currentUser) return;
    setActionLoading(true);
    const result = await adminDeleteUser(currentUser.id);
    if (result.error) {
      setFeedback({ type: 'error', message: result.error.message || 'Failed to delete user.' });
    } else {
      setFeedback({ type: 'success', message: `User ${currentUser.email} deleted successfully.` });
      await fetchUsers(false);
      closeModal();
    }
    setActionLoading(false);
  };

  if (!authCheckCompleted) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-lg text-gray-600">Verifying authorization...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 gap-4 bg-red-50 border border-red-200 rounded-md">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold text-red-700">Access Denied</h1>
        {feedback && <p className="text-red-600">{feedback.message}</p>}
        <button
          onClick={() => router.push('/sign-in')} // Adjust to your login page
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const renderModalContent = () => {
    if (!showModal) return null;
    const isEdit = showModal === 'edit';
    const title = isEdit ? `Edit User: ${currentUser?.email}` : "Create New User";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
              <XCircle size={28} />
            </button>
          </div>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleFormChange} required={!isEdit || (isEdit && !currentUser?.email)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password {isEdit ? "(Leave blank to keep current)" : ""}
              </label>
              <div className="relative mt-1">
                <input type={showPassword ? "text" : "password"} name="password" id="password" value={formData.password || ''} onChange={handleFormChange} required={!isEdit} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (optional, e.g., +12223334444)</label>
              <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label htmlFor="email_confirm" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" name="email_confirm" id="email_confirm" checked={formData.email_confirm || false} onChange={handleFormChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2" />
                Email Confirmed
              </label>
              <label htmlFor="phone_confirm" className={`flex items-center text-sm font-medium ${formData.phone ? 'text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                <input type="checkbox" name="phone_confirm" id="phone_confirm" checked={formData.phone_confirm || false} onChange={handleFormChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2" disabled={!formData.phone} />
                Phone Confirmed
              </label>
            </div>
            <div>
              <label htmlFor="user_metadata_str" className="block text-sm font-medium text-gray-700">User Metadata (JSON format)</label>
              <textarea name="user_metadata_str" id="user_metadata_str" value={formData.user_metadata_str || ''} onChange={handleFormChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs" placeholder='{ "custom_field": "value" }'></textarea>
            </div>
            <div>
              <label htmlFor="app_metadata_str" className="block text-sm font-medium text-gray-700">App Metadata (JSON format, e.g., roles)</label>
              <textarea name="app_metadata_str" id="app_metadata_str" value={formData.app_metadata_str || ''} onChange={handleFormChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs" placeholder='{ "roles": ["editor"], "plan": "premium" }'></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 flex items-center">
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirm || !currentUser) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h2>
          <p className="mb-6 text-gray-600">Are you sure you want to delete user <span className="font-medium text-gray-700">{currentUser.email}</span>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
            <button onClick={handleDeleteUser} disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 flex items-center">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <div className="flex gap-2">
        <button
          onClick={() => fetchUsers()}
          title="Refresh Users"
          disabled={isLoading}
          className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading && users.length > 0 ? "animate-spin" : ""} />
        </button>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <UserPlus size={18} /> Add New User
        </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 mb-4 text-sm rounded-lg flex items-center gap-2 ${feedback.type === 'error' ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`} role="alert">
          {feedback.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium">{feedback.type === 'error' ? 'Error: ' : 'Success: '}</span> {feedback.message}
        </div>
      )}

      {isLoading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      )}

      {!isLoading && users.length === 0 && authCheckCompleted && isAuthorized && (
        <p className="text-center text-gray-500 py-10 text-lg">No users found or an error occurred. Try refreshing.</p>
      )}

      {users.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">User ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" title={user.email}>{user.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs hidden md:table-cell" title={user.id}>{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {user.email_confirmed_at && <span title={`Email confirmed: ${new Date(user.email_confirmed_at).toLocaleString()}`} className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-1">Email ✓</span>}
                    {!user.email_confirmed_at && <span title="Email not confirmed" className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-1">Email !</span>}
                    {user.phone && user.phone_confirmed_at && <span title={`Phone confirmed: ${new Date(user.phone_confirmed_at).toLocaleString()}`} className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Phone ✓</span>}
                    {user.phone && !user.phone_confirmed_at && <span title="Phone not confirmed" className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Phone !</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button onClick={() => handleOpenEditModal(user)} className="text-indigo-600 hover:text-indigo-800 transition-colors duration-150" title="Edit User">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleOpenDeleteConfirm(user)} className="text-red-500 hover:text-red-700 transition-colors duration-150" title="Delete User">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {renderModalContent()}
      {renderDeleteConfirmModal()}
    </div>
  );
}