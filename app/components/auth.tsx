import { useState } from "react";
import { supabase } from "../supabase-client";

export const Auth = () => {
  const [userLogin, setUserLogin] = useState({
    email: "",
    password: "",
  });

  const [clientLogin, setClientLogin] = useState({
    email: "",
    client_key: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUserLogin = async () => {
    setError("");

    if (!userLogin.email || !userLogin.password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userLogin.email,
        password: userLogin.password,
      });

      console.log("Login data:", data);
      console.log("Login error:", error);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log("Login successful!");
      // Don't navigate - let page.tsx detect the session change
      // The loading state will stay true until page.tsx re-renders
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleClientLogin = async () => {
    setError("");

    if (!clientLogin.email || !clientLogin.client_key) {
      setError("Email and client key are required");
      return;
    }

    setLoading(true);

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('client_email', clientLogin.email)
        .eq('client_key', clientLogin.client_key)
        .single();

      if (clientError || !clientData) {
        setError('Invalid email or client key');
        setLoading(false);
        return;
      }

      // Store client info and navigate
      sessionStorage.setItem('client_data', JSON.stringify(clientData));
      window.location.href = `/client_jobs?client_key=${clientData.client_key}`;
    } catch (err) {
      console.error("Client login error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: "user" | "client") => {
    if (e.key === "Enter") {
      if (type === "user") {
        handleUserLogin();
      } else {
        handleClientLogin();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[url('../public/background.jpg')] bg-cover bg-center p-1">
      <div className="p-12 w-full">
        <h1 className="text-3xl m-2 w-65 bg-gray-400/10 rounded-2xl font-bold text-center text-mono mb-12">
          Client/User Login
        </h1>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 border border-red-500 bg-red-500/10 text-red-500 p-4 text-center rounded-lg">
            {error}
          </div>
        )}

        {/* Login Forms */}
        <div className="grid grid-cols-2 place-items-center">
          {/* User Login Form */}
          <div className="grid gap-4 place-items-center p-8">
            <h2 className="text-xl font-mono text-center mb-4">User Login</h2>

            <input
              type="email"
              value={userLogin.email}
              onChange={(e) =>
                setUserLogin({ ...userLogin, email: e.target.value })
              }
              onKeyPress={(e) => handleKeyPress(e, "user")}
              placeholder="Enter User Email..."
              disabled={loading}
              className="w-full max-w-md bg-blue-200/25 border border-blue-200/25 text-white text-center p-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <input
              type="password"
              value={userLogin.password}
              onChange={(e) =>
                setUserLogin({ ...userLogin, password: e.target.value })
              }
              onKeyPress={(e) => handleKeyPress(e, "user")}
              placeholder="Enter User Password..."
              disabled={loading}
              className="w-full max-w-md bg-blue-200/25 border border-blue-200/25 text-white text-center p-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <button
              onClick={handleUserLogin}
              disabled={loading}
              className="w-full max-w-md bg-blue-200/25 border border-blue-200/25 rounded-lg px-8 py-4 hover:bg-blue-200 hover:border-blue-200 hover:text-black transition-colors disabled:opacity-50"
            >
              {loading ? "Logging in..." : "User Login"}
            </button>
          </div>

          {/* Client Login Form */}
          <div className="grid gap-4 place-items-center p-8">
            <h2 className="text-xl font-mono text-center mb-4">
              Client Login
            </h2>

            <input
              type="email"
              value={clientLogin.email}
              onChange={(e) =>
                setClientLogin({ ...clientLogin, email: e.target.value })
              }
              onKeyPress={(e) => handleKeyPress(e, "client")}
              placeholder="Enter Client Email..."
              disabled={loading}
              className="w-full max-w-md bg-blue-200/25 border border-blue-200/25 text-white text-center p-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <input
              type="text"
              value={clientLogin.client_key}
              onChange={(e) =>
                setClientLogin({
                  ...clientLogin,
                  client_key: e.target.value,
                })
              }
              onKeyPress={(e) => handleKeyPress(e, "client")}
              placeholder="Enter Client Key..."
              disabled={loading}
              className="w-full max-w-md bg-blue-200/25 border border-blue-200/25 text-white text-center p-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <button
              onClick={handleClientLogin}
              disabled={loading}
              className="w-full max-w-md bg-blue-200/25 border border-blue-200/25 rounded-lg px-8 py-4 hover:bg-blue-200 hover:border-blue-200 hover:text-black transition-colors disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Client Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};