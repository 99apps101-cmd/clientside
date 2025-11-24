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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="border border-white p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="border border-white rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-xs">
              {client.client_name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="text-lg font-medium">{client.client_name}</div>
              <div className="text-sm text-gray-400">{client.client_email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="border border-white rounded-lg px-6 py-2 hover:bg-white hover:text-black transition-colors text-sm"
          >
            Logout
          </button>
        </div>

        {/* Jobs Table */}
        <div className="border border-white">
          {/* Table Header */}
          <div className="bg-black border-b border-white p-4 text-center text-xl font-medium">
            Your Jobs
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-4 border-b border-white">
            <div className="border-r border-white p-4 text-center font-medium">
              Job Name
            </div>
            <div className="border-r border-white p-4 text-center font-medium">
              Price
            </div>
            <div className="border-r border-white p-4 text-center font-medium">
              Revisions
            </div>
            <div className="p-4 text-center font-medium">
              Action
            </div>
          </div>

          {/* Table Rows */}
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No jobs available yet.
            </div>
          ) : (
            jobs.map((job, index) => (
              <div 
                key={job.job_id} 
                className={`grid grid-cols-4 ${index !== jobs.length - 1 ? 'border-b border-white' : ''}`}
              >
                <div className="border-r border-white p-6 text-center">
                  {job.job_name}
                </div>
                <div className="border-r border-white p-6 text-center">
                  ${job.price}
                </div>
                <div className="border-r border-white p-6 text-center">
                  {job.number_rev} revisions
                </div>
                <div className="p-6 flex justify-center items-center">
                  <button 
                    onClick={() => handleViewJob(job.job_id)}
                    className="border border-white px-6 py-2 rounded-lg hover:bg-white hover:text-black transition-colors"
                  >
                    View Details
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