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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="border border-white p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="col-span-2 space-y-6">
            {/* Header */}
            <div className="flex gap-4 mb-8">
              <div className="border border-white rounded-lg px-6 py-3 flex-1 text-center">
                {clientName}
              </div>
              <button 
                onClick={handleBack}
                className="border border-white rounded-lg px-12 py-3 hover:bg-white hover:text-black transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleLogout}
                className="border border-white rounded-lg px-8 py-3 hover:bg-white hover:text-black transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Job Name */}
            <div className="text-2xl font-medium mb-6">
              {job.job_name}
            </div>

            {/* Price and Revision */}
            <div className="flex gap-8 mb-6">
              <div className="text-lg">
                <span className="text-gray-400">Price: </span>${job.price}
              </div>
              <div className="text-lg">
                <span className="text-gray-400">Revisions Allowed: </span>{job.number_rev}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="text-gray-400 mb-2">Description</div>
              <div className="border border-white rounded-lg p-4 min-h-[100px]">
                {job.description}
              </div>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="border border-white rounded-lg p-6">
                <div className="text-lg font-medium mb-4">Uploaded Files</div>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between border border-white rounded p-3">
                      <div>
                        <div className="font-medium">{file.file_name}</div>
                        <div className="text-sm text-gray-400">
                          Revision {file.revision_number} • {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadFile(file.file_key, file.file_name)}
                          className="border border-white rounded px-4 py-1 hover:bg-white hover:text-black transition-colors text-sm"
                        >
                          Download
                        </button>
                        
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Right Column - Comments Log */}
          <div className="col-span-1">
            <div className="border border-white rounded-lg p-6 h-full flex flex-col">
              <div className="text-center text-lg font-medium mb-4">
                Comments
              </div>
              
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[400px]">
                {comments.length === 0 ? (
                  <div className="text-gray-400 text-center">No comments yet</div>
                ) : (
                  comments.map((comment, index) => (
                    <div 
                      key={index}
                      className="border border-white rounded p-3 text-sm"
                    >
                      <div className="text-gray-400 text-xs mb-1">
                        {comment.from_client ? 'You' : 'Team'}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                      {comment.comment}
                    </div>
                  ))
                )}
              </div>
            </div>
        

              {/* Comment Input */}
              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or request changes..."
                  rows={3}
                  className="w-full bg-black border border-white rounded-lg px-4 py-3 focus:outline-none focus:border-white resize-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-full border border-white rounded-lg px-4 py-2 hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}