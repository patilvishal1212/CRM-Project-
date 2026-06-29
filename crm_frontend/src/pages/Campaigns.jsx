import React, { useState, useEffect } from 'react';
import { campaignService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Campaigns = () => {
  const { isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '0.00',
    status: 'active',
  });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getAll();
      setCampaigns(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch campaigns. Ensure the Django API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      budget: '0.00',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      budget: campaign.budget,
      status: campaign.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Administrators can modify campaigns.');
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingCampaign) {
        await campaignService.update(editingCampaign.id, formData);
      } else {
        await campaignService.create(formData);
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert(err.error || 'Failed to submit campaign.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This will remove all associated statistics.')) {
      return;
    }

    try {
      await campaignService.delete(id);
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert(err.error || 'Failed to delete campaign.');
    }
  };

  // Stats calculation
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalBudget = campaigns.reduce((acc, c) => acc + parseFloat(c.budget), 0);

  const getStatusPill = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50';
      case 'paused':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50';
      case 'completed':
        return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/40';
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Marketing Campaigns</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Track and configure corporate client engagement campaigns.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Campaign
          </button>
        )}
      </div>

      {/* Campaigns Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Campaigns</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{totalCampaigns}</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Campaigns</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{activeCampaigns}</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Combined Budget</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Campaigns Lists Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <svg className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 font-medium text-sm">Syncing marketing metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl">
          <p>{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
          <svg className="w-12 h-12 text-slate-350 dark:text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="text-slate-550 dark:text-slate-400 font-semibold">No campaigns configured.</p>
          {isAdmin && <p className="text-xs text-slate-400 mt-1">Get started by creating your first campaign campaign.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <div 
              key={camp.id} 
              className="flex flex-col justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusPill(camp.status)}`}>
                    {camp.status}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Budget</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">${parseFloat(camp.budget).toLocaleString()}</p>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">{camp.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                  {camp.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800/80 mt-4 space-y-4">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Start: {camp.start_date}</span>
                  <span>End: {camp.end_date}</span>
                </div>

                {isAdmin && (
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleOpenEdit(camp)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-350 rounded-xl cursor-pointer"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleDelete(camp.id)}
                      className="px-3 py-1.5 border border-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold text-rose-500 hover:text-rose-600 rounded-xl cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h4 className="font-bold text-slate-850 dark:text-white">
                  {editingCampaign ? 'Edit Campaign Details' : 'Create Marketing Campaign'}
                </h4>
                <p className="text-xs text-slate-400">Provide campaign schedule and target budgets.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campaign Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    required
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status *</label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Saving...' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
