import { useState, FormEvent, ChangeEvent } from "react";
import { supabase } from "../supabase-client";
import { useRouter } from "next/navigation";

export const Auth = () => {
  const router = useRouter();

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
      const { error } = await supabase.auth.signInWithPassword({
        email: userLogin.email,
        password: userLogin.password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push("/client_jobs");
    } catch (err) {
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
      // First verify client credentials against your clients table
      const { data: clientData, error: verifyError } = await supabase.rpc(
        "verify_client_login",
        {
          p_email: clientLogin.email,
          p_client_key: clientLogin.client_key,
        },
      );

      if (verifyError || !clientData || clientData.length === 0) {
        setError("Invalid email or client key");
        setLoading(false);
        return;
      }

      const client = clientData[0];

      // Try to sign in with Supabase auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: clientLogin.email,
          password: clientLogin.client_key,
        });

      // If user doesn't exist, create them
      if (authError?.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: clientLogin.email,
            password: clientLogin.client_key,
            options: {
              data: {
                client_key: client.client_key,
                client_name: client.client_name,
                client_id: client.id,
                user_type: "client",
              },
            },
          });

        if (signUpError) {
          setError("Error creating account: " + signUpError.message);
          setLoading(false);
          return;
        }

        router.push("/client_jobs");
      } else if (authError) {
        setError("Login error: " + authError.message);
        setLoading(false);
        return;
      } else {
        // Successfully logged in
        router.push("/client_jobs");
      }
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-1">
      <div className="p-12  w-full content-center">
        <h1 className="text-3xl font-bold text-center mb-12">Login</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 border border-red-500 text-red-500 text-center rounded">
            {error}
          </div>
        )}

        {/* Login Forms */}
        <div className="grid grid-cols-1 grid-rows-1 gap-10 mb-12 content-evenly">
          {/* User Login Form */}
          <div className="space-y-6">
            <h2 className="text-xl font-mono text-center   mb-4 ">
              User Login
            </h2>
            <input
              type="email"
              value={userLogin.email}
              onChange={(e) =>
                setUserLogin({ ...userLogin, email: e.target.value })
              }
              onKeyPress={(e) => handleKeyPress(e, "user")}
              placeholder="Enter User Email"
              disabled={loading}
              className="w-200 bg-black border border-white text-white text-center  p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
            />
            <input
              type="password"
              value={userLogin.password}
              onChange={(e) =>
                setUserLogin({ ...userLogin, password: e.target.value })
              }
              onKeyPress={(e) => handleKeyPress(e, "user")}
              placeholder="Enter User Password"
              disabled={loading}
              className="w-200 bg-black border border-white text-white text-center p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
            />
            <button
              onClick={handleUserLogin}
              disabled={loading}
              className="w-200  border border-white rounded-lg px-8 py-4 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {loading ? "Logging in..." : "User Login"}
            </button>
          </div>
          <div className="grid grid-cols-1 grid-rows-1 gap-10 mb-12 justify-center">
            {/* Client Login Form */}
            <div className="space-y-6">
              <h2 className="text-xl text-center  mb-4">Client Login</h2>
              <div className="grid grid-cols-2 grid-rows-1 gap-1 mb-12 self-center">
                <input
                  type="email"
                  value={clientLogin.email}
                  onChange={(e) =>
                    setClientLogin({ ...clientLogin, email: e.target.value })
                  }
                  onKeyPress={(e) => handleKeyPress(e, "client")}
                  placeholder="email"
                  disabled={loading}
                  className=" justify-center w-100 bg-black border border-white text-white text-center p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
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
                  placeholder="client_key"
                  disabled={loading}
                  className="w-100 bg-black border border-white text-white text-center p-4 rounded focus:outline-none focus:border-white disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleClientLogin}
                disabled={loading}
                className=" justify-center w-150 border border-white rounded-lg px-8 py-4 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Client Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
