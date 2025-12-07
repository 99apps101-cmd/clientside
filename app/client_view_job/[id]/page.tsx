"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '../../supabase-client';

export default function ClientViewJob() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.id;
  const urlClientKey = searchParams.get('client_key');

  const [job, setJob] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [clientKey, setClientKey] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndFetchJob();
  }, [jobId]);

  const checkAuthAndFetchJob = async () => {
    try {
      // Try to get client data from session storage OR URL
      let clientData;
      const storedClient = sessionStorage.getItem('client_data');
      
      if (storedClient) {
        clientData = JSON.parse(storedClient);
      } else if (urlClientKey) {
        // If we have client_key in URL but not in session, verify it exists
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_key', urlClientKey)
          .single();
        
        if (error || !data) {
          router.push('/');
          return;
        }
        
        clientData = data;
        // Store for future use
        sessionStorage.setItem('client_data', JSON.stringify(clientData));
      } else {
        // No auth data at all
        router.push('/');
        return;
      }

      setClientName(clientData.client_name);
      setClientKey(clientData.client_key);

      // Fetch job info
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_id", parseInt(jobId as string))
        .eq("client_key", clientData.client_key)
        .single();

      if (jobError) {
        console.error("Error fetching job:", jobError.message);
        setError(`Error: ${jobError.message}`);
        setLoading(false);
        return;
      }

      if (!jobData) {
        setError("Job not found");
        setLoading(false);
        return;
      }

      setJob(jobData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("job_id", parseInt(jobId as string))
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError.message);
      } else {
        setComments(commentsData || []);
      }

      // Fetch files
      await fetchFiles();
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("job_files")
        .select("*")
        .eq("job_id", parseInt(jobId as string))
        .order("revision_number", { ascending: false });

      if (error) {
        console.error("Error fetching files:", error);
      } else {
        setFiles(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDownloadFile = async (fileKey: string, fileName: string) => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const { downloadUrl } = await response.json();
      
      // Open download in new tab
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };


  const handleBack = () => {
    router.push(`/client_jobs?client_key=${clientKey}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('client_data');
    router.push('/');
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from("comments")
        .insert([{
          job_id: parseInt(jobId as string),
          comment: newComment,
          from_client: true
        }]);

      if (error) {
        console.error("Error adding comment:", error.message);
        return;
      }

      setNewComment("");
      checkAuthAndFetchJob();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="text-xl">Job not found</div>
          {error && <div className="text-red-500">{error}</div>}
          <button 
            onClick={handleBack}
            className="border border-white rounded-lg px-8 py-3 hover:bg-white hover:text-black transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center text-white px-4 py-6 sm:px-6 sm:py-8">
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Logo + Service Name */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/logo.svg"   
          alt="Client Side logo"
          className="h-16 sm:h-20 w-auto mb-3"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Side</h1>
      </div>

      {/* Header card */}
      <div className="border border-white/30 rounded-2xl p-4 sm:p-6 bg-white/5 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-semibold text-sm sm:text-base">
            {clientName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-medium truncate">{clientName}</div>
            <div className="text-sm text-white/60 break-all">{job?.client_email}</div>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleBack}
            className="flex-1 sm:flex-none border border-white/30 rounded-lg px-4 py-2 hover:bg-white/20 transition text-sm"
          >
            Back
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 sm:flex-none border border-white/30 rounded-lg px-4 py-2 hover:bg-white/20 transition text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Job card */}
      <div className="border border-white/30 rounded-2xl p-5 sm:p-6 bg-white/5 backdrop-blur space-y-5">
        <h2 className="text-xl sm:text-2xl font-semibold break-words">{job?.job_name}</h2>

        <div className="flex flex-col xs:flex-row gap-3 xs:gap-6 text-sm sm:text-base">
          <div><span className="text-white/60">Price:</span> ${job?.price}</div>
          <div><span className="text-white/60">Revisions Allowed:</span> {job?.number_rev}</div>
        </div>

        <div>
          <div className="text-white/60 mb-2">Description</div>
          <div className="border border-white/30 rounded-lg p-4 bg-black/20 break-words">{job?.description}</div>
        </div>
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div className="border border-white/30 rounded-2xl p-5 sm:p-6 bg-white/5 backdrop-blur">
          <h3 className="text-lg sm:text-xl font-medium mb-4">Uploaded Files</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/30 rounded-lg p-4 bg-white/10"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium break-all">{file.file_name}</div>
                  <div className="text-sm text-white/60">
                    Revision {file.revision_number} · {formatFileSize(file.file_size)} · {new Date(file.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadFile(file.file_key, file.file_name)}
                  className="w-full sm:w-auto border border-white/30 rounded-lg px-4 py-2 hover:bg-white/20 transition text-sm"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="border border-white/30 rounded-2xl p-5 sm:p-6 bg-white/5 backdrop-blur space-y-4">
        <h3 className="text-lg sm:text-xl font-medium text-center">Comments</h3>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
          {comments.length === 0 ? (
            <div className="text-white/60 text-sm text-center">No comments yet</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="border border-white/30 rounded-lg p-3 bg-white/10 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/60 text-xs">{c.from_client ? 'You' : 'Team'}</span>
                  <span className="text-white/60 text-xs">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="break-words">{c.comment}</div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or request changes…"
            rows={3}
            className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="w-full border border-white/30 rounded-lg px-4 py-2 hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  </div>
);
}