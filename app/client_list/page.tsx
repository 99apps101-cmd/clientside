"use client";

import { supabase } from "../supabase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientListDashboard() {
  
  interface Clients {
    id: number;
    client_name: string;
    client_email: string;
    client_key: string;
  }

  const [clients, setClients] = useState<Clients[]>([]);
  const router = useRouter();

  // Move fetchClients outside to avoid it being recreated on every render
  useEffect(() => {
    let isMounted = true;

    const fetchClients = async () => {
      const { error, data } = await supabase
        .from("clients")
        .select("*")
        .order("client_name", { ascending: true }); 

      if (error) {
        console.error("Error reading Clients: ", error.message);
        return;
      }
      
      // Only update state if component is still mounted
      if (isMounted && data) {
        setClients(data);
      }
    };

    fetchClients();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateClient = () => {
    router.push("/create_client");
  };

  const handleManageClient = (clientId: number) => {
    router.push(`/manage_clients?id=${clientId}`);
  };

  const handleLogout = () => {
    // Add your logout logic here
    router.push("/login"); // or wherever you want to go
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header with User Info */}
      <div className="border border-white p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center text-sm">
              Pic
            </div>
            <div>
              <div className="text-lg">User</div>
              <div className="text-lg">Name</div>
            </div>
          </div>
          
          {/* Optional: Logout or Settings Button */}
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
          className="border border-white px-16 py-4 text-lg hover:bg-white hover:text-black transition-colors"
        >
          Create Client
        </button>
      </div>

      {/* Client List Table */}
      <div className="border border-white">
        {/* Table Header */}
        <div className="bg-black border-b border-white p-4 text-center text-2xl font-medium">
          Client List
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-4 border-b border-white">
          <div className="border-r border-white p-4 text-center text-lg font-medium">
            Client
          </div>
          <div className="border-r border-white p-4 text-center text-lg font-medium">
            Email
          </div>
          <div className="border-r border-white p-4 text-center text-lg font-medium">
            Status (# completed of #)
          </div>
          <div className="p-4 text-center text-lg font-medium">
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
                  className="border border-white px-8 py-2 hover:bg-white hover:text-black transition-colors"
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