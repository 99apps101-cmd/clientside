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
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">

    <div className="w-full max-w-2xl space-y-6">

      {/* Logo + Service Name */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/logo.svg"
          alt="Client Side logo"
          className="h-16 sm:h-20 w-auto mb-3"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Side</h1>
      </div>

      {/* Error bar */}
      {error && (
        <div className="border border-red-500 bg-red-500/10 text-red-500 p-3 rounded-lg text-center text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Form card */}
      <div className="border border-white/30 rounded-2xl p-6 sm:p-8 bg-white/5 backdrop-blur space-y-5">

        <h2 className="text-xl sm:text-2xl font-semibold text-center">Create Client</h2>

        <input
          type="text"
          name="name"
          value={newClient.client_name}
          onChange={(e) => {
            setNewClient((prev) => ({ ...prev, client_name: e.target.value }));
            if (error) setError("");
          }}
          placeholder="Client Name"
          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="email"
          name="email"
          value={newClient.client_email}
          onChange={(e) => {
            setNewClient((prev) => ({ ...prev, client_email: e.target.value }));
            if (error) setError("");
          }}
          placeholder="Client Email"
          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full border border-white/30 rounded-lg px-6 py-3 hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Submit"}
          </button>
          <button
            onClick={handleBack}
            disabled={loading}
            className="w-full border border-white/30 rounded-lg px-6 py-3 hover:bg-white/20 transition disabled:opacity-50"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  </div>
);
}