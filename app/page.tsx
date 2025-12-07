"use client";
import { useEffect, useState } from "react";
import {Auth} from "./components/auth";
import { supabase } from "./supabase-client";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  interface Clients {
    id: number;
    client_name: string;
    client_email: string;
    client_key: string;
    user_id: string;
  }

  const [clients, setClients] = useState<Clients[]>([]);

  // First useEffect for session management
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const currentSession = await supabase.auth.getSession();
      console.log("Session data:", currentSession);
      
      if (isMounted) {
        setSession(currentSession.data.session);
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed:", _event);
        if (isMounted) {
          setSession(session);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Second useEffect for fetching clients when session changes
  useEffect(() => {
    let isMounted = true;

    const fetchClients = async () => {
      if (!session?.user?.id) {
        console.log("No user ID found");
        return;
      }

      console.log("Fetching clients for user:", session.user.id);

      const { error, data } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", session.user.id)
        .order("client_name", { ascending: true }); 

      console.log("Clients data:", data);
      console.log("Clients error:", error);

      if (error) {
        console.error("Error reading Clients: ", error.message);
        return;
      }
      
      if (isMounted) {
        setClients(data || []);
      }
    };

    if (session) {
      console.log("Session exists, fetching clients...");
      fetchClients();
    }

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleCreateClient = () => {
    router.push("/create_client");
  };

  const handleManageClient = (clientId: number) => {
    router.push(`/manage_clients?id=${clientId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

return (
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center text-white">

    {/* ----------  HEADER  ---------- */}
    <header className="max-w-5xl mx-auto px-6 pt-8 pb-4">
      <div className="flex items-center justify-between">

        {/* profile */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-semibold">
            {session.user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-white/70">Signed in as</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
        </div>

        {/* logout */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20
                     hover:bg-white/20 transition"
        >
          Logout
        </button>
      </div>
    </header>

    {/* ----------  MAIN  ---------- */}
    <main className="max-w-5xl mx-auto px-6 pb-12">

      {/* CTA row */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Your Clients</h1>
        <button
          onClick={handleCreateClient}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-blue-500/20 border border-blue-400/30
                     hover:bg-blue-500/30 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Client</span>
        </button>
      </div>

      {/* ----------  CLIENT CARDS  ---------- */}
      {clients.length === 0 ? (
        <div className="grid place-content-center text-center py-20">
          <p className="text-white/60">No clients yet</p>
          <button
            onClick={handleCreateClient}
            className="mt-4 text-blue-400 hover:underline"
          >
            Create your first one
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div
              key={c.id}
              className="group relative p-5 rounded-2xl bg-white/5 backdrop-blur
                         border border-white/10 hover:border-white/20
                         transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{c.client_name}</h3>
                  <p className="text-sm text-white/60 mt-1">{c.client_email}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-white/10 text-xs">0 / 0</span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleManageClient(c.id)}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-white/10
                             border border-white/20 hover:bg-white/20
                             transition text-sm"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  </div>
);
}