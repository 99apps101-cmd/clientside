"use client";
import { useState } from "react";
import { supabase } from "../supabase-client";

export const Auth = () => {
  const [userLogin, setUserLogin] = useState({ email: "", password: "" });
  const [clientLogin, setClientLogin] = useState({ email: "", client_key: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUserLogin = async () => {
    setError("");
    if (!userLogin.email || !userLogin.password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: userLogin.email,
      password: userLogin.password,
    });
    if (error) setError(error.message);
  };

  const handleClientLogin = async () => {
    setError("");
    if (!clientLogin.email || !clientLogin.client_key) {
      setError("Email and client key are required");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("client_email", clientLogin.email)
      .eq("client_key", clientLogin.client_key)
      .single();
    if (error || !data) {
      setError("Invalid email or client key");
      setLoading(false);
      return;
    }
    sessionStorage.setItem("client_data", JSON.stringify(data));
    window.location.href = `/client_jobs?client_key=${data.client_key}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: "user" | "client") => {
    if (e.key === "Enter") type === "user" ? handleUserLogin() : handleClientLogin();
  };

  /* ----------  MOBILE-FIRST JSX  ---------- */
  return (
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl">

        {/* LOGO + SERVICE NAME */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {/* LOGO SLOT – replace src or use <Image /> from next/image */}
          <img
            src="/logo.png"
            alt="Client Side logo"
            className="h-16 sm:h-20 w-auto mb-3"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Client Side
          </h1>
        </div>

        {/* Error bar */}
        {error && (
          <div className="mb-6 border border-red-500 bg-red-500/10 text-red-500 p-3 rounded-lg text-center text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* ---- User Login ---- */}
          <div className="grid gap-4 place-items-stretch p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
            <h2 className="text-lg sm:text-xl font-semibold text-center">User Login</h2>

            <input
              type="email"
              value={userLogin.email}
              onChange={(e) => setUserLogin({ ...userLogin, email: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, "user")}
              placeholder="User Email"
              disabled={loading}
              className="w-full bg-blue-200/25 border border-blue-200/25 text-white placeholder-white/70 text-center p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <input
              type="password"
              value={userLogin.password}
              onChange={(e) => setUserLogin({ ...userLogin, password: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, "user")}
              placeholder="User Password"
              disabled={loading}
              className="w-full bg-blue-200/25 border border-blue-200/25 text-white placeholder-white/70 text-center p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <button
              onClick={handleUserLogin}
              disabled={loading}
              className="w-full bg-blue-200/25 border border-blue-200/25 rounded-lg px-6 py-4 hover:bg-blue-200 hover:border-blue-200 hover:text-black transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? "Logging in…" : "User Login"}
            </button>
          </div>

          {/* ---- Client Login ---- */}
          <div className="grid gap-4 place-items-stretch p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
            <h2 className="text-lg sm:text-xl font-semibold text-center">Client Login</h2>

            <input
              type="email"
              value={clientLogin.email}
              onChange={(e) => setClientLogin({ ...clientLogin, email: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, "client")}
              placeholder="Client Email"
              disabled={loading}
              className="w-full bg-blue-200/25 border border-blue-200/25 text-white placeholder-white/70 text-center p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <input
              type="text"
              value={clientLogin.client_key}
              onChange={(e) => setClientLogin({ ...clientLogin, client_key: e.target.value })}
              onKeyPress={(e) => handleKeyPress(e, "client")}
              placeholder="Client Key"
              disabled={loading}
              className="w-full bg-blue-200/25 border border-blue-200/25 text-white placeholder-white/70 text-center p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-blue-200 focus:text-black disabled:opacity-50"
            />

            <button
              onClick={handleClientLogin}
              disabled={loading}
              className="w-full bg-blue-200/25 border border-blue-200/25 rounded-lg px-6 py-4 hover:bg-blue-200 hover:border-blue-200 hover:text-black transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? "Logging in…" : "Client Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};