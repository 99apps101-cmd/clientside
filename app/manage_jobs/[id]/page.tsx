"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../supabase-client';

export default function ManageJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      console.log("Looking for job with ID:", jobId);

      // Fetch job info using job_id
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_id", parseInt(jobId as string))
        .single();

      console.log("Job data:", jobData);
      console.log("Job error:", jobError);

      if (jobError) {
        console.error("Error fetching job:", jobError.message);
        setError(`Error: ${jobError.message}`);
        setLoading(false);
        return;
      }

      if (!jobData) {
        setError("Job not found in database");
        setLoading(false);
        return;
      }

      setJob(jobData);

      // Fetch client name and ID using client_key
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("client_name, id")
        .eq("client_key", jobData.client_key)
        .single();

      if (clientError) {
        console.error("Error fetching client:", clientError.message);
      } else {
        setClientName(clientData.client_name);
        setClientId(clientData.id);
      }

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
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (clientId) {
      router.push(`/manage_clients?id=${clientId}`);
    } else {
      router.back();
    }
  };

  const handleDeleteJob = async () => {
    const confirmDelete = confirm(`Are you sure you want to delete "${job.job_name}"? This action cannot be undone.`);
    
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      // Delete the job
      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("job_id", parseInt(jobId as string));

      if (deleteError) {
        console.error("Error deleting job:", deleteError.message);
        alert(`Error deleting job: ${deleteError.message}`);
        setDeleting(false);
        return;
      }

      // Success - navigate back to manage clients page
      if (clientId) {
        router.push(`/manage_clients?id=${clientId}`);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred while deleting");
      setDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && !file) return;

    try {
      const { error } = await supabase
        .from("comments")
        .insert([{
          job_id: parseInt(jobId as string),
          comment: newComment,
          from_client: false
        }]);

      if (error) {
        console.error("Error adding comment:", error.message);
        return;
      }

      setNewComment("");
      setFile(null);
      fetchJobData();
    } catch (error) {
      console.error("Error:", error);
    }
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
          <div className="text-gray-400">Job ID: {jobId}</div>
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
                <span className="text-gray-400">Revision #: </span>{job.number_rev}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="text-gray-400 mb-2">Description</div>
              <div className="border border-white rounded-lg p-4 min-h-[100px]">
                {job.description}
              </div>
            </div>

            {/* Upload File Button */}
            <div>
              <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="fileUpload">
                <div className="border border-white rounded-lg px-8 py-3 inline-block cursor-pointer hover:bg-white hover:text-black transition-colors">
                  {file ? file.name : 'Upload File Button'}
                </div>
              </label>
            </div>

            {/* Delete Job Button */}
            <div className="pt-6">
              <button
                onClick={handleDeleteJob}
                disabled={deleting}
                className="border border-red-500 text-red-500 rounded-lg px-8 py-3 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          </div>

          {/* Right Column - Comments Log */}
          <div className="col-span-1">
            <div className="border border-white rounded-lg p-6 h-full flex flex-col">
              <div className="text-center text-lg font-medium mb-4">
                Log/Comments from Client
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
                        {comment.from_client ? 'Client' : 'You'}
                      </div>
                      {comment.comment}
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comment input"
                  className="w-full bg-black border border-white rounded-lg px-4 py-3 focus:outline-none focus:border-white"
                />
                <button
                  onClick={handleAddComment}
                  className="w-full border border-white rounded-lg px-4 py-2 hover:bg-white hover:text-black transition-colors"
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