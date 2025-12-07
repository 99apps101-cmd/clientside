"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../supabase-client';

function CreateJobContent() {
  const [newJob, setNewJob] = useState({
    job_name: "",
    price: "",
    number_rev: "",
    description: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientKey, setClientKey] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');

  // Declare fetchClientKey before using it in useEffect
  const fetchClientKey = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("client_key")
        .eq("id", parseInt(clientId as string))
        .single();

      if (clientError) {
        console.error("Error fetching client:", clientError);
        setError(`Error fetching client: ${clientError.message}`);
        return;
      }

      if (clientData) {
        setClientKey(clientData.client_key);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to fetch client data");
    }
  };

  // Fetch client key when component loads
  useEffect(() => {
    let isMounted = true;

    const loadClientKey = async () => {
      if (clientId && isMounted) {
        await fetchClientKey();
      }
    };

    loadClientKey();

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  const handleSubmit = async () => {
    setError("");

    // Validate empty fields
    if (!newJob.job_name.trim()) {
      setError("Job name is required");
      return;
    }
    if (!newJob.price.trim()) {
      setError("Price is required");
      return;
    }
    if (!newJob.number_rev.trim()) {
      setError("Revision number is required");
      return;
    }
    if (!newJob.description.trim()) {
      setError("Description is required");
      return;
    }

    if (!clientKey) {
      setError("Client key not found. Please try again.");
      return;
    }

    setLoading(true);

    try {
      // Create the job with the client's key
      const { data, error: supabaseError } = await supabase
        .from("jobs")
        .insert([{
          job_name: newJob.job_name,
          price: parseFloat(newJob.price),
          number_rev: parseInt(newJob.number_rev),
          description: newJob.description,
          client_key: clientKey
        }])
        .select();

      console.log("Insert result:", data);
      console.log("Insert error:", supabaseError);

      if (supabaseError) {
        setError(`Error creating job: ${supabaseError.message}`);
        setLoading(false);
        return;
      }

      // Success - navigate back to manage clients page
      router.push(`/manage_clients?id=${clientId}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (clientId) {
      router.push(`/manage_clients?id=${clientId}`);
    } else {
      router.push('/');
    }
  };

  return (
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">

    <div className="w-full max-w-2xl space-y-6">

      {/* Logo + Service Name */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/logo.png"
          alt="Client Side logo"
          className="h-16 sm:h-20 w-auto mb-3"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Side</h1>
      </div>

      {/* Error bar */}
      {error && (
        <div className="border border-red-500 bg-red-500/10 text-red-500 p-3 rounded-lg text-center text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Form card */}
      <div className="border border-white/30 rounded-2xl p-6 sm:p-8 bg-white/5 backdrop-blur space-y-5">

        <h2 className="text-xl sm:text-2xl font-semibold text-center">Create Job</h2>

        <input
          type="text"
          name="job_name"
          value={newJob.job_name}
          onChange={(e) => {
            setNewJob((prev) => ({ ...prev, job_name: e.target.value }));
            if (error) setError("");
          }}
          placeholder="Job Name"
          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="number"
          name="price"
          value={newJob.price}
          onChange={(e) => {
            setNewJob((prev) => ({ ...prev, price: e.target.value }));
            if (error) setError("");
          }}
          placeholder="Price ($)"
          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="number"
          name="number_rev"
          value={newJob.number_rev}
          onChange={(e) => {
            setNewJob((prev) => ({ ...prev, number_rev: e.target.value }));
            if (error) setError("");
          }}
          placeholder="Allowed Revisions #"
          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <textarea
          name="description"
          value={newJob.description}
          onChange={(e) => {
            setNewJob((prev) => ({ ...prev, description: e.target.value }));
            if (error) setError("");
          }}
          placeholder="Description"
          rows={5}
          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full border border-white/30 rounded-lg px-6 py-3 hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create Job"}
          </button>
          <button
            onClick={handleBack}
            disabled={loading}
            className="w-full border border-white/30 rounded-lg px-6 py-3 hover:bg-white/20 transition disabled:opacity-50"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

export default function CreateJob() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[url('../public/background.jpg')] bg-cover bg-center flex items-center justify-center p-8">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <CreateJobContent />
    </Suspense>
  );
}