"use client";

import { supabase } from "../supabase-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateClient() {
  const [newClient, setNewClient] = useState({
    client_name: "",
    client_email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        router.push('/'); // Redirect if not logged in
      }
    };
    getUser();
  }, []);

  // Generate random 8-digit key
  const generateClientKey = () => {
    return Math.floor(10000000 + Math.random() * 90000000);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    // Validate empty fields
    if (!newClient.client_name.trim()) {
      setError("Name is required");
      return;
    }
    if (!newClient.client_email.trim()) {
      setError("Email is required");
      return;
    }

    if (!userId) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const clientKey = generateClientKey();

      const { error: supabaseError } = await supabase
        .from("clients")
        .insert([{
          ...newClient,
          client_key: clientKey,
          user_id: userId  // Add user_id
        }])
        .select();

      if (supabaseError) {
        setError(`Error adding client: ${supabaseError.message}`);
        setLoading(false);
        return;
      }

      // Success - navigate back to main page
      router.push("/");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="border border-white p-16 w-full max-w-2xl">
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="border border-red-500 bg-red-500/10 text-red-500 p-4 text-center">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              name="name"
              value={newClient.client_name}
              onChange={(e) => {
                setNewClient((prev) => ({
                  ...prev,
                  client_name: e.target.value,
                }));
                if (error) setError("");
              }}
              placeholder="Name"
              className="w-full bg-black border border-white text-white text-center p-4 focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={newClient.client_email}
              onChange={(e) => {
                setNewClient((prev) => ({
                  ...prev,
                  client_email: e.target.value,
                }));
                if (error) setError("");
              }}
              placeholder="email"
              className="w-full bg-black border border-white text-white text-center p-4 focus:outline-none focus:border-white"
            />
          </div>

          <div className="pt-12 space-y-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full border border-white text-white text-center p-4 hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Submit"}
            </button>
            
            <button
              onClick={handleBack}
              disabled={loading}
              className="w-full border border-white text-white text-center p-4 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}