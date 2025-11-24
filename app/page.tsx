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
    <div className="min-h-screen bg-[url('../public/background.jpg')] bg-cover bg-center text-white p-8">
      {/* Header with User Info */}
      <div className="border border-white p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center text-sm">
              Pic
            </div>
            <div>
              <div className="text-lg">{session?.user?.email || 'User'}</div>
              <div className="text-lg">Name</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="border border-white rounded-lg px-8 py-3 hover:bg-white hover:text-black transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Full width line */}
      <div className="w-full h-px bg-white mb-8"></div>

      {/* Create Client Button - Centered */}
      <div className="flex justify-center mb-12">
        <button 
          onClick={handleCreateClient}
          className="rounded border border-blue-200/25 bg-blue-200/25 px-16 py-4 text-lg hover:bg-blue-200 hover:border-blue-200 hover:text-black transition-colors"
        >
          Create Client
        </button>
      </div>

      {/* Client List Table */}
      <div className="border border-white">
        {/* Table Header */}
        <div className="border-b bg-blue-200/50 border-white p-4 text-center text-2xl font-medium">
          Client List
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-4 border-b border-white">
          <div className="border-r bg-blue-200/25 border-white p-4 text-center text-lg font-medium">
            Client
          </div>
          <div className="border-r bg-blue-200/25 border-white p-4 text-center text-lg font-medium">
            Email
          </div>
          <div className="border-r bg-blue-200/25 border-white p-4 text-center text-lg font-medium">
            Status (# completed of #)
          </div>
          <div className="p-4 bg-blue-200/25 text-center text-lg font-medium">
            Manage Button
          </div>
        </div>

        {/* Table Rows */}
        {clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No clients yet. Create one to get started!
          </div>
        ) : (
          clients.map((client, index) => (
            <div 
              key={client.id} 
              className={`grid grid-cols-4 ${index !== clients.length - 1 ? 'border-b border-white' : ''}`}
            >
              <div className="border-r border-white p-6 text-center">
                {client.client_name}
              </div>
              <div className="border-r border-white p-6 text-center">
                {client.client_email}
              </div>
              <div className="border-r border-white p-6 text-center">
                0 of 0
              </div>
              <div className="p-6 flex justify-center items-center">
                <button 
                  onClick={() => handleManageClient(client.id)}
                  className="border border-blue-200/25 bg-blue-200/25 px-8 py-2 hover:bg-blue-200 hover:border-blue-200 hover:text-black transition-colors rounded"
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