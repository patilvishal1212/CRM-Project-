import React, { useState, useEffect, useRef } from "react";
import { leadService, campaignService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal & Slide Panel states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    campaign: "",
    first_name: "",
    last_name: "",
    job_title: "",
    email: "",
    prospect_linkedin: "",
    contact_number: "",
    direct_number: "",
    industry: "",
    company_name: "",
    company_linkedin: "",
    company_size: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    comments: "",
  });
  const [audioFile, setAudioFile] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch leads independently
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const leadsData = await leadService.getAll();
      setLeads(Array.isArray(leadsData) ? leadsData : leadsData.results || []);
      setError("");
    } catch (err) {
      console.error("Leads fetch error:", err);
      setError("Failed to fetch leads. Ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaigns independently (uses lightweight dropdown endpoint)
  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      setCampaignsError("");
      const data = await campaignService.getDropdown();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Campaigns fetch error:", err);
      setCampaignsError("Could not load campaigns. Please retry.");
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchLeads(), fetchCampaigns()]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!formData.campaign) {
      alert("Please select a campaign.");
      return;
    }

    setSubmitLoading(true);
    const dataToSend = new FormData();

    // Append fields
    Object.keys(formData).forEach((key) => {
      dataToSend.append(key, formData[key]);
    });

    if (audioFile) {
      dataToSend.append("call_recording", audioFile);
    }

    try {
      await leadService.create(dataToSend);
      setIsModalOpen(false);

      // Reset form
      setFormData({
        campaign: "",
        first_name: "",
        last_name: "",
        job_title: "",
        email: "",
        prospect_linkedin: "",
        contact_number: "",
        direct_number: "",
        industry: "",
        company_name: "",
        company_linkedin: "",
        company_size: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "",
        comments: "",
      });
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      fetchData(); // reload
    } catch (err) {
      console.error(err);
      alert(err.error || "Failed to submit lead.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.first_name} ${lead.last_name} ${lead.email} ${lead.company_name || ""} ${lead.job_title}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCampaign =
      selectedCampaign === "all" || lead.campaign === selectedCampaign;
    const matchesStatus =
      selectedStatus === "all" || lead.qa_status === selectedStatus;

    return matchesSearch && matchesCampaign && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "qualified":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50";
      case "disqualified":
        return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50";
      case "rework":
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50";
      case "pending":
        return "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800/40";
      default:
        return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50";
    }
  };

  // Export to CSV mockup
  const handleExport = () => {
    if (filteredLeads.length === 0) return;
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Job Title",
      "Company",
      "Prospect LinkedIn Link",
      "Contact Number",
      "Direct Number",
      "Industry",
      "Company LinkedIn",
      "Company Size",
      "Address",
      "City",
      "State",
      "Zip Code",
      "Country",
      "QA Status",
      "Comments",
      "Date Created\n",
    ];
    const rows = filteredLeads.map((l) => [
      l.first_name,
      l.last_name,
      l.email,
      l.job_title,
      l.company_name || "N/A",
      l.prospect_linkedin,
      l.contact_number,
      l.direct_number,
      l.industry,
      l.company_linkedin,
      l.company_size,
      l.address,
      l.city || "N/A",
      l.state || "N/A",
      l.zip_code || "N/A",
      l.country || "N/A", 
      l.qa_status,
      l.comments,
      new Date(l.created_at).toLocaleDateString() + "\n",
    ]);

    const blob = new Blob(
      [headers.join(","), ...rows.map((r) => r.join(","))],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Title Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Leads Database
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Search, filter, and add new sales prospects.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-sm transition-all duration-200 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Lead
          </button>
        </div>
      </div>

      {/* Filter Bars Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search prospects, emails, companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl focus:outline-none text-slate-700 dark:text-slate-200 text-sm transition-all duration-200"
          />
        </div>

        {/* Campaign Filter */}
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none text-slate-600 dark:text-slate-300 text-sm focus:border-indigo-500"
        >
          <option value="all">All Campaigns</option>
          {campaignsLoading ? (
            <option disabled>Loading campaigns...</option>
          ) : (
            campaigns.map((camp) => (
              <option key={camp.id} value={camp.name}>
                {camp.name}
              </option>
            ))
          )}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none text-slate-600 dark:text-slate-300 text-sm focus:border-indigo-500"
        >
          <option value="all">All QA Statuses</option>
          <option value="pending">Pending QA Review</option>
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
          <option value="rework">Rework</option>
          <option value="in progress">In Progress</option>
          <option value="tbd">TBD</option>
        </select>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <svg
              className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-slate-400 font-medium text-sm">
              Syncing lead databases...
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-24 text-center">
            <svg
              className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">
              No prospects matched your criteria.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Try clearing filters or create a new lead.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-4 px-6">Name / Title</th>
                  <th className="py-4 px-6">Company / Industry</th>
                  <th className="py-4 px-6">Campaign</th>
                  <th className="py-4 px-6">QA Status</th>
                  <th className="py-4 px-6">Assigned To</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setActiveLead(lead)}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 cursor-pointer transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {lead.job_title}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {lead.company_name || "N/A"}
                      </p>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {lead.industry}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {lead.campaign}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadgeClass(lead.qa_status)}`}
                      >
                        {lead.qa_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {lead.assigned_to_name || "Unassigned"}
                    </td>
                    <td
                      className="py-4 px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveLead(lead)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">
                  Create New Lead Entry
                </h4>
                <p className="text-xs text-slate-400">
                  Fill in prospect and company demographic details.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form
              onSubmit={handleCreateLead}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campaign Choice */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Campaign *
                  </label>
                  {campaignsError ? (
                    <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                      <p className="text-xs text-rose-600 dark:text-rose-400 flex-1">{campaignsError}</p>
                      <button
                        type="button"
                        onClick={fetchCampaigns}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline shrink-0"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      name="campaign"
                      required
                      value={formData.campaign}
                      onChange={handleInputChange}
                      disabled={campaignsLoading}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {campaignsLoading ? (
                        <option value="">Loading campaigns...</option>
                      ) : campaigns.length === 0 ? (
                        <option value="">No campaigns found — create a campaign first</option>
                      ) : (
                        <>
                          <option value="">Select a Campaign...</option>
                          {campaigns.map((camp) => (
                            <option key={camp.id} value={camp.name}>
                              {camp.name}{camp.status !== 'active' ? ` (${camp.status})` : ''}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>

                <div className="hidden md:block" />

                {/* Name fields */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>

                {/* Job Title & Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Job Title 
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>

                {/* LinkedIn and Phones */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Prospect LinkedIn Link 
                  </label>
                  <input
                    type="url"
                    name="prospect_linkedin"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.prospect_linkedin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Contact Number 
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>

                {/* Direct line & Company name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Direct Number
                  </label>
                  <input
                    type="text"
                    name="direct_number"
                    value={formData.direct_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Company Name 
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>

                {/* Industry & Company LinkedIn */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Industry 
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Company LinkedIn Link 
                  </label>
                  <input
                    type="url"
                    name="company_linkedin"
                    placeholder="https://linkedin.com/company/..."
                    value={formData.company_linkedin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>

                {/* Company size & address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Company Size 
                  </label>
                  <input
                    type="text"
                    name="company_size"
                    placeholder="e.g. 50-200 employees"
                    value={formData.company_size}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    HQ Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                  <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-350"
                  />
                </div>
              </div>

              {/* Call recording & Comments */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Call Audio file (.mp3, .wav, .m4a - Max 50MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-950/50 file:cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Comments & Notes
                </label>
                <textarea
                  name="comments"
                  rows={3}
                  value={formData.comments}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none text-sm text-slate-700 dark:text-slate-300"
                />
              </div>

              {/* Form buttons */}
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
                  {submitLoading ? "Creating Lead..." : "Submit Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Lead Side Drawer Panel */}
      {activeLead && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-slideOver">
          <div className="flex flex-col flex-1 h-full overflow-hidden">
            {/* Drawer Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Prospect Overview
                </span>
                <h4 className="font-bold text-slate-850 dark:text-white leading-tight">
                  {activeLead.first_name} {activeLead.last_name}
                </h4>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                > 
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              {/* QA Status Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Quality Assurance Review
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadgeClass(activeLead.qa_status)}`}
                  >
                    {activeLead.qa_status}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    Assigned to: {activeLead.assigned_to_name || "N/A"}
                  </span>
                </div>
                {activeLead.qa_comments && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    &ldquo;{activeLead.qa_comments}&rdquo;
                  </p>
                )}
              </div>

              {/* Call recording audio control */}
              {activeLead.call_recording && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-white">
                    Call Recording
                  </h5>
                  <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                    <audio
                      src={activeLead.call_recording}
                      controls
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Demographic Prospect details */}
              <div className="space-y-4">
                <h5 className="font-bold text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Demographics & Contact Info
                </h5>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Job Title
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.job_title}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Email
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350 select-all">
                      {activeLead.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Contact Number
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.contact_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Direct Number
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.direct_number || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    LinkedIn Profile
                  </span>
                  <p className="mt-0.5">
                    <a
                      href={activeLead.prospect_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-500 hover:underline inline-flex items-center gap-1"
                    >
                      View Profile
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </p>
                </div>
              </div>

              {/* Company statistics */}
              <div className="space-y-4">
                <h5 className="font-bold text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  Company Profile
                </h5>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Company Name
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.company_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Industry
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.industry}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Company Size
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.company_size}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      HQ Address
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      City
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.city || "N/A"}
                    </p>
                  </div>
                                    <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      State
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.state || "N/A"}
                    </p>
                  </div>
                                    <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Zip Code
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.zip_code || "N/A"}
                    </p>
                  </div>
                                    <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Country
                    </span>
                    <p className="font-medium text-slate-700 dark:text-slate-350">
                      {activeLead.country || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Company LinkedIn
                  </span>
                  <p className="mt-0.5">
                    <a
                      href={activeLead.company_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-500 hover:underline inline-flex items-center gap-1"
                    >
                      View Company Page
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </p>
                </div>
              </div>

              {/* Submission metadata */}
              {activeLead.comments && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Representative Comments
                  </span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl text-slate-650 dark:text-slate-450 border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                    {activeLead.comments}
                  </p>
                </div>
              )}

              <div className="pt-4 text-[10px] text-slate-400 font-mono">
                <span>
                  Submitted at:{" "}
                  {new Date(activeLead.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
