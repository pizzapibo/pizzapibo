import React from "react";

export default function Navbar() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        padding: "12px 10vw",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <h2>pibo</h2>

      <div style={{ display: "flex", gap: 16 }}>
        <button className="pibo-button" onClick={() => scrollTo("pizza-3d")}>
          3D
        </button>
        <button className="pibo-button" onClick={() => scrollTo("order")}>
          سفارش
        </button>
        <button className="pibo-button" onClick={() => scrollTo("contact")}>
          تماس
        </button>
      </div>
    </nav>
  );
}
