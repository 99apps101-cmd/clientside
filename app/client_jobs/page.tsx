"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabase-client';

export default function ClientJobs() {
  const router = useRouter();

  interface Job {
    job_id: number;
    job_name: string;
    price: number;
    number_rev: number;
    description: string;
  }

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientKey, setClientKey] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchJobs();
  }, []);

  const checkAuthAndFetchJobs = async () => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/');
        return;
      }

      // Get client info from user metadata
      const userClientKey = user.user_metadata?.client_key;
      setClientName(user.user_metadata?.client_name || 'Client');
      setClientEmail(user.email || '');
      setClientKey(userClientKey);

      if (!userClientKey) {
        router.push('/');
        return;
      }

      // Fetch jobs - RLS will automatically filter by client_key
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_key', userClientKey)
        .order('created_at', { ascending: false });

      console.log('Jobs data:', jobsData);
      console.log('Jobs error:', jobsError);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      } else {
        setJobs(jobsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    await supabase.auth.signOut({ scope: 'local' });
    console.log('Logout successful, redirecting...');
    window.location.href = '/';
  };

  const handleViewJob = (jobId: number) => {
    router.push(`/client_view_job/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
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
              {clientName?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="text-lg font-medium">{clientName || 'Client'}</div>
              <div className="text-sm text-gray-400">{clientEmail}</div>
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