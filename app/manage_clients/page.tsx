"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "../supabase-client";

//Interfaces//
interface Clients {
  id: number;
  client_name: string;
  client_email: string;
  client_key: string;
  user_id: string;
}

interface Jobs {
  job_id: number;
  client_key: string;
  job_name: string;
  price: number;
  number_rev: number;
}

function ManageClientContent() {
  const [client, setClient] = useState<Clients | null>(null);
  const [jobs, setJobs] = useState<Jobs[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('id');

  useEffect(() => {
    let isMounted = true;

    const fetchClientAndJobs = async () => {
      console.log("Fetching client with ID:", clientId);
      
      if (!clientId) {
        console.error("No client ID provided");
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }
        if (isMounted) {
          setUserEmail(user.email || '');
        }

        // Fetch client info - ensure it belongs to the logged-in user
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", parseInt(clientId))
          .eq("user_id", user.id)  // Only fetch if it belongs to this user
          .single();

        console.log("Client data:", clientData);
        console.log("Client error:", clientError);

        if (clientError) {
          console.error("Error reading Client: ", clientError.message);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setClient(clientData);
        }

        // Fetch jobs with the client's key
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("client_key", clientData.client_key)
          .order("created_at", { ascending: false });

        console.log("Jobs data:", jobsData);
        console.log("Jobs error:", jobsError);

        if (jobsError) {
          console.error("Error reading Jobs: ", jobsError.message);
        }

        if (isMounted) {
          setJobs(jobsData || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClientAndJobs();

    return () => {
      isMounted = false;
    };
  }, [clientId, router]);

  //Change Pages//
  const handleCreateJob = () => {
    router.push(`/create_jobs?client_id=${clientId}`);
  };

  const handleManageJob = (jobId: number) => {
    router.push(`/manage_jobs/${jobId}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteClient = async () => {
    if (!client) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${client.client_name}"? This will also delete all associated jobs and comments. This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      // Delete all jobs associated with this client (comments will cascade if ON DELETE CASCADE is set)
      const { error: jobsError } = await supabase
        .from("jobs")
        .delete()
        .eq("client_key", client.client_key);

      if (jobsError) {
        console.error("Error deleting jobs:", jobsError.message);
        alert(`Error deleting jobs: ${jobsError.message}`);
        setDeleting(false);
        return;
      }

      // Delete the client
      const { error: clientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (clientError) {
        console.error("Error deleting client:", clientError.message);
        alert(`Error deleting client: ${clientError.message}`);
        setDeleting(false);
        return;
      }

      // Success - navigate back to home page
      router.push('/');
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred while deleting");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="text-xl">Loading...</div>
          <div className="text-gray-400">Client ID: {clientId}</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="text-xl">Client not found</div>
          <div className="text-gray-400">Client ID: {clientId}</div>
          <button 
            onClick={handleBack}
            className="border border-white rounded-lg px-8 py-3 hover:bg-white hover:text-black transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  //HTML//
  return (
    <div className="min-h-screen bg-[url('../public/background.jpg')] bg-cover bg-center text-white p-8">
      <div className="">
        {/* Header with User Info and Logout */}
        <div className="border-5 border-blue-200/25 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-xs">
              Pic
            </div>
            <div className="text-sm">{userEmail || 'User'}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="border border-blue-200/25 rounded-lg px-6 py-2 hover:bg-white hover:text-black transition-colors text-sm"
          >
            Logout
          </button>
        </div>

        {/* User Name Header */}
        <div className="border-2 w-fit h-fit border-blue-200/25 rounded-lg p-6 text-left text-2xl mb-6  ">
          Client Name - {client.client_name}
        </div>

        {/* Display Key and Create Job Buttons */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setShowKey(!showKey)}
            className="border border-white rounded-lg px-8 py-3 hover:bg-white hover:text-black transition-colors"
          >
            {showKey ? client.client_key : 'Display Key'}
          </button>
          <button 
            onClick={handleCreateJob}
            className="border border-white rounded-lg px-8 py-3 hover:bg-white hover:text-black transition-colors"
          >
            Create Job
          </button>
          <button 
            onClick={handleBack}
            className="border border-white rounded-lg px-8 py-3 hover:bg-white hover:text-black transition-colors"
          >
            Back
          </button>
          <button 
            onClick={handleDeleteClient}
            disabled={deleting}
            className="border border-red-500 text-red-500 rounded-lg px-8 py-3 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {deleting ? "Deleting..." : "Delete Client"}
          </button>
        </div>

        {/* Job List Table */}
        <div className="border border-white">
          {/* Table Header */}
          <div className=" border-b border-white p-4 text-center text-xl font-medium">
            Job List
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-3 border-b border-white">
            <div className="border-r border-white p-4 text-center font-medium">
              Job name
            </div>
            <div className="border-r border-white p-4 text-center font-medium">
              Status
            </div>
            <div className="p-4 text-center font-medium">
              Manage Job
            </div>
          </div>

          {/* Table Rows */}
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No jobs yet. Create one to get started!
            </div>
          ) : (
            jobs.map((job, index) => (
              <div 
                key={job.job_id} 
                className={`grid grid-cols-3 ${index !== jobs.length - 1 ? 'border-b border-white' : ''}`}
              >
                <div className="border-r border-white p-6 text-center">
                  {job.job_name}
                </div>
                <div className="border-r border-white p-6 text-center">
                  {job.number_rev} revisions • ${job.price}
                </div>
                <div className="p-6 flex justify-center items-center">
                  <button 
                    onClick={() => handleManageJob(job.job_id)}
                    className="border border-white px-6 py-2 hover:bg-white hover:text-black transition-colors"
                  >
                    Manage Button
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ManageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[url('../public/background.jpg')] bg-cover bg-center text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <ManageClientContent />
    </Suspense>
  );
}