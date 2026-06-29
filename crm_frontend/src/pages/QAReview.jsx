import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const QAReview = () => {
  const { user, isQA, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  // QA form fields
  const [qaStatus, setQaStatus] = useState('qualified');
  const [qaComments, setQaComments] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadService.getAll();
      setLeads(data);
      setError('');
      
      // Auto-select first pending lead if available
      const pending = data.filter(l => l.qa_status === 'pending');
      if (pending.length > 0) {
        setSelectedLead(pending[0]);
        setQaStatus('qualified');
        setQaComments('');
      } else if (data.length > 0) {
        setSelectedLead(data[0]);
        setQaStatus(data[0].qa_status);
        setQaComments(data[0].qa_comments || '');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch lead queue. Ensure the API server is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Update form inputs when selected lead changes
  useEffect(() => {
    if (selectedLead) {
      setQaStatus(selectedLead.qa_status === 'pending' ? 'qualified' : selectedLead.qa_status);
      setQaComments(selectedLead.qa_comments || '');
    }
  }, [selectedLead]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    
    setSubmitLoading(true);
    try {
      await leadService.review(selectedLead.id, qaStatus, qaComments);
      alert('Quality feedback submitted successfully.');
      fetchLeads(); // reload
    } catch (err) {
      console.error(err);
      alert(err.error || 'Failed to submit review.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isQA && !isAdmin) {
    return (
      <div className="p-6 text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl">
        <h3 className="font-bold">Access Denied</h3>
        <p className="mt-1 text-sm">Only QA Auditors and Administrators can access the QA Feedback queue.</p>
      </div>
    );
  }

  // Segment leads
  const pendingLeads = leads.filter(l => l.qa_status === 'pending');
  const reviewedLeads = leads.filter(l => l.qa_status !== 'pending');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'qualified':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50';
      case 'disqualified':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50';
      case 'rework':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50';
      case 'pending':
        return 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800/40';
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">QA Feedback Audit Queue</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">Listen to call pitches, review representative notes, and qualify sales prospects.</p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <svg className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 font-medium text-sm">Syncing QA queues...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl">
          <p>{error}</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
          <p className="text-slate-500 dark:text-slate-400 font-semibold">No leads registered in the CRM.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Queue Lists */}
          <div className="lg:col-span-5 space-y-6 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin">
            {/* Pending List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span>Awaiting Audit</span>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md">
                  {pendingLeads.length}
                </span>
              </h4>
              
              {pendingLeads.length === 0 ? (
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 dark:text-slate-500">
                  All clear! No pending audits.
                </div>
              ) : (
                pendingLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer transition-all duration-200 ${
                      selectedLead?.id === lead.id
                        ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700/80 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lead.first_name} {lead.last_name}</h5>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{lead.company_name || 'N/A'} • {lead.job_title}</p>
                      </div>
                      {lead.call_recording && (
                        <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Already Reviewed List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completed Audits</h4>
              {reviewedLeads.length === 0 ? (
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 dark:text-slate-500">
                  No completed audits yet.
                </div>
              ) : (
                reviewedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer transition-all duration-200 ${
                      selectedLead?.id === lead.id
                        ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700/80 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lead.first_name} {lead.last_name}</h5>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{lead.company_name || 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadge(lead.qa_status)}`}>
                        {lead.qa_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Pane: Auditing Action panel */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
            {selectedLead ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                        {selectedLead.first_name} {selectedLead.last_name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{selectedLead.job_title} at <span className="font-semibold">{selectedLead.company_name || selectedLead.industry}</span></p>
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(selectedLead.qa_status)}`}>
                        {selectedLead.qa_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call audio file */}
                {selectedLead.call_recording ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Call recording audio</label>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                      <audio 
                        src={selectedLead.call_recording} 
                        controls 
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 dark:text-slate-500">
                    No call recording audio uploaded for this lead.
                  </div>
                )}

                {/* Lead commentary */}
                {selectedLead.comments && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Representative Notes</label>
                    <p className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl text-xs text-slate-600 dark:text-slate-450 border border-slate-100 dark:border-slate-800/80 leading-relaxed font-sans">
                      {selectedLead.comments}
                    </p>
                  </div>
                )}

                {/* Audit forms */}
                <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-white">Auditor Assessment</h5>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verification Status *</label>
                    <select
                      value={qaStatus}
                      onChange={(e) => setQaStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                    >
                      <option value="qualified">Qualified by QA</option>
                      <option value="disqualified">Disqualified by QA</option>
                      <option value="rework">Rework by QA</option>
                      <option value="in progress">Progress by QA</option>
                      <option value="tbd">TBD by QA</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Audit Comments & Feedback *</label>
                    <textarea
                      required
                      rows={4}
                      value={qaComments}
                      onChange={(e) => setQaComments(e.target.value)}
                      placeholder="Write audit findings, details on pitch quality, issues identified, or next steps..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {submitLoading ? 'Submitting assessment...' : 'Submit Audit Report'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-slate-400 dark:text-slate-650">
                <svg className="w-16 h-16 text-slate-300 dark:text-slate-800 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="font-semibold text-sm">Select a lead from the queue to evaluate.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QAReview;
