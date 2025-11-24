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
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center text-white p-4 md:p-8">

      {/* Header */}
      <div className="border border-white p-4 md:p-6 mb-6 md:mb-8 rounded-xl bg-black/20">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">

          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-white flex items-center justify-center">
              Pic
            </div>
            <div>
              <div className="text-base md:text-lg font-semibold">
                {session.user.email}
              </div>
              <div className="text-sm md:text-base opacity-80">Name</div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full md:w-auto border border-white rounded-lg px-6 py-2 hover:bg-white hover:text-black transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/40 mb-6 md:mb-8" />

      {/* Create Client */}
      <div className="flex justify-center mb-10">
        <button
          onClick={handleCreateClient}
          className="w-full md:w-auto rounded border border-blue-200/30 bg-blue-200/20 px-10 py-3 text-lg hover:bg-blue-200 hover:text-black transition"
        >
          Create Client
        </button>
      </div>

      {/* Client List */}
      <div className="border border-white rounded-xl overflow-hidden bg-black/20">

        <div className="border-b border-white p-4 text-center text-xl font-semibold bg-blue-200/40">
          Client List
        </div>

        {/* Desktop Column Headers */}
        <div className="hidden md:grid grid-cols-4 border-b border-white text-center font-medium bg-blue-200/20">
          <div className="border-r border-white p-4">Client</div>
          <div className="border-r border-white p-4">Email</div>
          <div className="border-r border-white p-4">Status</div>
          <div className="p-4">Manage</div>
        </div>

        {/* Rows */}
        {clients.length === 0 ? (
          <div className="p-6 text-center text-gray-300">No clients yet</div>
        ) : (
          clients.map((c, i) => (
            <div
              key={c.id}
              className={`grid grid-cols-1 md:grid-cols-4 ${
                i !== clients.length - 1 ? "border-b border-white/40" : ""
              }`}
            >
              {/* Mobile Card */}
              <div className="md:hidden p-4 space-y-4">

                <div className="flex justify-between">
                  <div>
                    <div className="text-gray-400 text-sm">Client</div>
                    <div className="font-semibold">{c.client_name}</div>
                  </div>
                  <button
                    onClick={() => handleManageClient(c.id)}
                    className="border border-blue-200/30 bg-blue-200/20 px-4 py-1 rounded hover:bg-blue-200 hover:text-black transition"
                  >
                    Manage
                  </button>
                </div>

                <div>
                  <div className="text-gray-400 text-sm">Email</div>
                  <div className="wrap-break-words text-sm">{c.client_email}</div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm">Status</div>
                  <div className="text-sm">0 of 0</div>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:flex items-center justify-center border-r border-white p-6">
                {c.client_name}
              </div>
              <div className="hidden md:flex items-center justify-center border-r border-white p-6 wrap-break-words">
                {c.client_email}
              </div>
              <div className="hidden md:flex items-center justify-center border-r border-white p-6">
                0 of 0
              </div>
              <div className="hidden md:flex items-center justify-center p-6">
                <button
                  onClick={() => handleManageClient(c.id)}
                  className="border border-blue-200/30 bg-blue-200/20 px-8 py-2 rounded hover:bg-blue-200 hover:text-black transition"
                >
                  Manage
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}