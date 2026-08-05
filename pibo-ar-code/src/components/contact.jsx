import React from "react";

export default function Contact() {
  const phone = "09140909878";

  return (
    <div>
      <h2>ارتباط با pibo</h2>

      <a href={`https://wa.me/98${phone.slice(1)}`} target="_blank">
        <button className="pibo-button">واتساپ</button>
      </a>

      <a href={`https://t.me/${phone}`} target="_blank">
        <button className="pibo-button">تلگرام</button>
      </a>
    </div>
  );
}
