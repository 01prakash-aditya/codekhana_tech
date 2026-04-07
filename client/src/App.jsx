import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Compiler from "./pages/Compiler";
import ProblemSet from "./pages/ProblemSet";
import Contribute from "./pages/Contribute";
import Community from "./pages/Community";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  const [isWarmingUp, setIsWarmingUp] = useState(true);
  const [warmupProgress, setWarmupProgress] = useState(0);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_URL || "https://codekhana-tech.onrender.com";
    const COMPILER_URL = import.meta.env.VITE_URL_COMP || "https://backend-oj.onrender.com";

    const minWarmupTimeMs = 30000;
    const maxWarmupTimeMs = 45000;
    const startedAt = Date.now();
    let cancelled = false;
    let minHideTimer = null;

    const pingOk = async (url) => {
      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "omit",
          cache: "no-store",
        });
        return response.ok;
      } catch {
        return false;
      }
    };

    const progressTimer = setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(98, Math.round((elapsed / maxWarmupTimeMs) * 100));
      setWarmupProgress(progress);
    }, 250);

    const forceHideTimer = setTimeout(() => {
      if (!cancelled) {
        setWarmupProgress(100);
        setIsWarmingUp(false);
      }
    }, maxWarmupTimeMs);

    Promise.all([
      pingOk(`${API_URL}/api/user/`),
      pingOk(`${COMPILER_URL}/`),
      pingOk(`${API_URL}/`),
    ]).then(([userReady, compilerReady]) => {
      if (!userReady || !compilerReady) {
        return;
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minWarmupTimeMs - elapsed);

      minHideTimer = setTimeout(() => {
        if (!cancelled) {
          clearTimeout(forceHideTimer);
          setWarmupProgress(100);
          setIsWarmingUp(false);
        }
      }, remaining);
    });

    return () => {
      cancelled = true;
      clearTimeout(forceHideTimer);
      if (minHideTimer) {
        clearTimeout(minHideTimer);
      }
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <BrowserRouter>
    {isWarmingUp && (
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-amber-300 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 px-4 py-2 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="text-sm font-semibold text-amber-900">
            Please wait, setting up environment for backend and user services (30-45 seconds)...
          </p>
          <span className="text-xs font-semibold text-amber-800">{warmupProgress}%</span>
        </div>
        <div className="mx-auto mt-2 h-2 w-full max-w-6xl overflow-hidden rounded-full bg-amber-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 transition-[width] duration-300"
            style={{ width: `${warmupProgress}%` }}
          />
        </div>
      </div>
    )}
    {/* header */}  
    <Header isWarmingUp={isWarmingUp} />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/about" element={<About/>} />
        <Route path="/sign-in" element={isWarmingUp ? <Home/> : <SignIn/>} />
        <Route path="/sign-up" element={isWarmingUp ? <Home/> : <SignUp/>} />
        <Route path="/compiler" element={isWarmingUp ? <Home/> : <Compiler/>} />
        <Route path="/problemset" element={isWarmingUp ? <Home/> : <ProblemSet/>} />
        <Route path="/contribute" element={isWarmingUp ? <Home/> : <Contribute/>} />
        <Route path="/community" element={isWarmingUp ? <Home/> : <Community/>} />
        <Route element = {<PrivateRoute/>}>
          <Route path="/profile" element={isWarmingUp ? <Home/> : <Profile/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}