"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../supabase-client';

export default function ClientViewJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuthAndFetchJob();
  }, [jobId]);

  const checkAuthAndFetchJob = async () => {
    try {
      // Check if user is authenticated as a client
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/');
        return;
      }

      const userClientKey = user.user_metadata?.client_key;
      
      if (!userClientKey) {
        router.push('/');
        return;
      }

      setClientName(user.user_metadata?.client_name || 'Client');

      // Fetch job info
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_id", parseInt(jobId as string))
        .eq("client_key", userClientKey) // Ensure client can only see their own job
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
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/client_jobs');
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
          </div>

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
                        {comment.from_client ? 'You' : 'Admin'}
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
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