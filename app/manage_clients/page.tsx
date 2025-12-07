"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "../supabase-client";

/* ----------  TYPES  ---------- */
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

/* ----------  CONTENT  ---------- */
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

  /* fetch client + jobs */
  useEffect(() => {
    let isMounted = true;
    const fetchClientAndJobs = async () => {
      if (!clientId) { if (isMounted) setLoading(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      if (isMounted) setUserEmail(user.email || '');

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', parseInt(clientId))
        .eq('user_id', user.id)
        .single();

      if (clientError || !clientData) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setClient(clientData);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_key', clientData.client_key)
        .order('created_at', { ascending: false });

      if (isMounted) setJobs(jobsData || []);
      if (isMounted) setLoading(false);
    };

    fetchClientAndJobs();
    return () => { isMounted = false; };
  }, [clientId, router]);

  /* handlers */
  const handleCreateJob = () => router.push(`/create_jobs?client_id=${clientId}`);
  const handleManageJob = (jobId: number) => router.push(`/manage_jobs/${jobId}`);
  const handleBack = () => router.push('/');
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };
  const handleDeleteClient = async () => {
    if (!client) return;
    if (!confirm(`Delete “${client.client_name}” and all its jobs? This cannot be undone.`)) return;
    setDeleting(true);
    await supabase.from('jobs').delete().eq('client_key', client.client_key);
    await supabase.from('clients').delete().eq('id', clientId);
    router.push('/');
  };

  /* loading / empty states */
  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-xl">Loading…</div>
    </div>
  );
  if (!client) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-xl">Client not found</div>
        <button onClick={handleBack} className="border border-white rounded-lg px-6 py-2 hover:bg-white hover:text-black transition">Go Back</button>
      </div>
    </div>
  );

  /* ----------  UI  ---------- */
 return (
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center text-white">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* ----------  HEADER  ---------- */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-semibold text-sm sm:text-base">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/60">Signed in as</p>
            <p className="font-medium truncate text-sm sm:text-base">{userEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={handleBack} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition text-sm">← Back</button>
          <button onClick={handleLogout} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 transition text-sm">Logout</button>
        </div>
      </header>

      {/* ----------  CLIENT CARD  ---------- */}
      <section className="mb-6 sm:mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 break-words">{client.client_name}</h2>
          <p className="text-sm text-white/60 break-all">{client.client_email}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setShowKey(!showKey)} className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition text-sm">{showKey ? 'Hide Key' : 'Show Key'}</button>
            {showKey && <span className="px-3 py-2 rounded-lg bg-black/20 font-mono text-xs sm:text-sm break-all max-w-full">{client.client_key}</span>}
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button onClick={handleCreateJob} className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/30 hover:bg-blue-500/30 transition text-sm">+ New Job</button>
          <button onClick={handleDeleteClient} disabled={deleting} className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 transition disabled:opacity-50 text-sm">{deleting ? 'Deleting…' : 'Delete'}</button>
        </div>
      </section>

      {/* ----------  JOBS  ---------- */}
      <section>
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Jobs</h3>
        {jobs.length === 0 ? (
          <div className="grid place-content-center py-12 sm:py-16 text-center text-white/60">
            <p className="text-sm sm:text-base">No jobs yet.</p>
            <button onClick={handleCreateJob} className="mt-2 sm:mt-3 text-blue-400 hover:underline text-sm">Create the first one</button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div key={job.job_id} className="p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base break-words">{job.job_name}</h4>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">{job.number_rev} revisions · ${job.price}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-xs shrink-0">{job.number_rev}/{job.price}</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => handleManageJob(job.job_id)} className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition text-sm">Manage</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  </div>
);
}

/* ----------  DEFAULT EXPORT  ---------- */
export default function ManageClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center text-white flex items-center justify-center">
          <div className="text-xl">Loading…</div>
        </div>
      }
    >
      <ManageClientContent />
    </Suspense>
  );
}