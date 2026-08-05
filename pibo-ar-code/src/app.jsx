import React, { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import PizzaShowcase3D from "./components/PizzaShowcase3D.jsx";
import Features from "./components/Features.jsx";
import OrderSection from "./components/OrderSection.jsx";
import Contact from "./components/Contact.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import { useScrollAnimation } from "./hooks/useScrollAnimation.js";

const DEFAULT_PASSWORD = "Arshiakamali2898";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  useScrollAnimation();

  const handleLogin = (password) => {
    if (password === DEFAULT_PASSWORD) {
      setIsAdmin(true);
    } else {
      alert("رمز اشتباهه");
    }
  };

  return (
    <div className="app-root">
      <Navbar />
      <Hero />

      <section className="section section-dark" id="pizza-3d" data-animate>
        <PizzaShowcase3D />
      </section>

      <section className="section section-light" id="features" data-animate>
        <Features />
      </section>

      <section className="section section-dark" id="order" data-animate>
        <OrderSection />
      </section>

      <section className="section section-light" id="contact" data-animate>
        <Contact />
      </section>

      <section className="section section-dark" id="admin">
        {!isAdmin ? <AdminLogin onLogin={handleLogin} /> : <AdminPanel />}
      </section>
    </div>
  );
}
