"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../supabase-client';

interface Client {
  id: number;
  client_name: string;
  client_email: string;
  client_key: string;
}

interface Job {
  job_id: number;
  job_name: string;
  price: number;
  number_rev: number;
  description: string;
}

function ClientJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlClientKey = searchParams.get('client_key');

  const [client, setClient] = useState<Client | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchClientAndJobs = async () => {
      try {
        console.log("=== CLIENT JOBS PAGE ===");
        console.log("URL client_key:", urlClientKey);
        
        // Try to get client data from session storage OR URL
        let clientData;
        const storedClient = sessionStorage.getItem('client_data');
        console.log("Stored client data:", storedClient);
        
        if (storedClient) {
          clientData = JSON.parse(storedClient);
          console.log("Using stored client:", clientData);
        } else if (urlClientKey) {
          console.log("No stored client, fetching with URL key...");
          // If we have client_key in URL but not in session, fetch it
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('client_key', urlClientKey)
            .single();
          
          console.log("Fetch result:", data, error);
          
          if (error || !data) {
            console.error("Client not found");
            router.push('/');
            return;
          }
          
          clientData = data;
          // Store for future use
          sessionStorage.setItem('client_data', JSON.stringify(clientData));
        } else {
          console.error("No client key in URL or storage");
          router.push('/');
          return;
        }

        if (isMounted) {
          setClient(clientData);
        }

        console.log("Fetching jobs for client_key:", clientData.client_key);

        // Fetch jobs for this client
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('client_key', clientData.client_key)
          .order('created_at', { ascending: false });

        console.log("Jobs data:", jobsData);
        console.log("Jobs error:", jobsError);

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError);
        } else if (isMounted) {
          setJobs(jobsData || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
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
  }, [urlClientKey, router]);

  const handleLogout = () => {
    console.log("Logging out...");
    sessionStorage.removeItem('client_data');
    router.push('/');
  };

  const handleViewJob = (jobId: number) => {
    if (!client) return;
    router.push(`/client_view_job/${jobId}?client_key=${client.client_key}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Client not found</div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center text-white px-4 py-6 sm:px-6 sm:py-8">
    <div className="max-w-5xl mx-auto">

      {/* Logo + Service Name */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/logo.png"
          alt="Client Side logo"
          className="h-16 sm:h-20 w-auto mb-3"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Side</h1>
      </div>

      {/* Header card */}
      <div className="border border-white/30 rounded-2xl p-4 sm:p-6 mb-6 bg-white/5 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-semibold text-sm sm:text-base">
            {client.client_name?.charAt(0) || 'C'}
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-medium truncate">{client.client_name}</div>
            <div className="text-sm text-white/60 break-all">{client.client_email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto border border-white/30 rounded-lg px-4 py-2 hover:bg-white/20 transition text-sm"
        >
          Logout
        </button>
      </div>

      {/* Jobs list */}
      <div className="border border-white/30 rounded-2xl overflow-hidden bg-white/5 backdrop-blur">

        <div className="border-b border-white/30 p-4 text-center text-lg sm:text-xl font-medium">
          Your Jobs
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center text-white/60">No jobs available yet.</div>
        ) : (
          <div className="divide-y divide-white/30">
            {jobs.map((job) => (
              <div
                key={job.job_id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-base sm:text-lg break-words">{job.job_name}</div>
                  <div className="text-sm text-white/60 mt-1">
                    ${job.price} · {job.number_rev} revisions
                  </div>
                </div>
                <button
                  onClick={() => handleViewJob(job.job_id)}
                  className="w-full sm:w-auto border border-white/30 rounded-lg px-4 py-2 hover:bg-white/20 transition text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default function ClientJobs() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <ClientJobsContent />
    </Suspense>
  );
}