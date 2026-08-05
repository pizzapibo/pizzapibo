import React from "react";

export default function Hero() {
  return (
    <header className="section section-dark" style={{ paddingTop: 120 }} data-animate>
      <h1>pibo — پیتزا رو قبل از خوردن، سه‌بعدی ببین.</h1>
      <p>با مدل‌های GLB و USDZ روی آیفون و اندروید.</p>
      <button className="pibo-button" onClick={() => document.getElementById("pizza-3d").scrollIntoView({ behavior: "smooth" })}>
        نمایش سه‌بعدی
      </button>
    </header>
  );
}
