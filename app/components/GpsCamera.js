"use client";
import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const GpsCamera = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const now = new Date();
        const dateStr = now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        try {
          // 1. Fetch Detailed Address
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          const geoData = await geoRes.json();
          const a = geoData.address;

          // Construct lines like the example
          const line1 = `${a.city || a.town || "Junagadh"}, ${a.state || "Gujarat"}, India 🇮🇳`;
          const line2 = `${a.suburb || a.neighbourhood || a.road || "Local Area"}, ${a.city || "Junagadh"}, ${a.state}, ${a.postcode || ""}, India`;

          const screenshot = webcamRef.current.getScreenshot();
          // Zoomed in Satellite Map
          const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&z=17&l=sat&size=400,400`;

          const mainImg = new Image();
          const mapImg = new Image();
          mainImg.src = screenshot;

          mainImg.onload = () => {
            mapImg.crossOrigin = "anonymous";
            mapImg.src = mapUrl;
            mapImg.onload = () => {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");
              canvas.width = mainImg.width;
              canvas.height = mainImg.height;

              ctx.drawImage(mainImg, 0, 0);

              // --- LAYOUT CALCULATIONS ---
              const boxPadding = 20;
              const boxH = 190;
              const boxW = canvas.width - boxPadding * 2;
              const boxX = boxPadding;
              const boxY = canvas.height - boxH - boxPadding;

              // 2. Draw Rounded Black Box (The Overlay)
              ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxW, boxH, 30);
              ctx.fill();

              // 3. Draw Map (Fixed Square - No Overflow)
              const mapSize = 150;
              const mapX = boxX + 20;
              const mapY = boxY + (boxH - mapSize) / 2;

              ctx.save();
              ctx.beginPath();
              ctx.roundRect(mapX, mapY, mapSize, mapSize, 20);
              ctx.clip(); // This prevents map overflow
              // Offset the map draw to center it
              ctx.drawImage(mapImg, mapX, mapY, mapSize, mapSize);

              // Draw a small Red Pin in the center of the map
              ctx.fillStyle = "red";
              ctx.beginPath();
              ctx.arc(
                mapX + mapSize / 2,
                mapY + mapSize / 2,
                6,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.restore();

              // 4. Draw Text
              const textX = mapX + mapSize + 20;
              const maxTextWidth = boxW - mapSize - 60;

              ctx.fillStyle = "white";

              // Line 1: Bold Title
              ctx.font = "bold 26px sans-serif";
              ctx.fillText(line1, textX, boxY + 50, maxTextWidth);

              // Line 2: Details (Wraps/Shortens if too long)
              ctx.font = "18px sans-serif";
              ctx.fillStyle = "#e0e0e0";
              ctx.fillText(
                line2.substring(0, 50),
                textX,
                boxY + 85,
                maxTextWidth,
              );

              // Line 3: Lat/Long
              ctx.fillStyle = "white";
              ctx.fillText(
                `Lat ${latitude.toFixed(6)}° Long ${longitude.toFixed(6)}°`,
                textX,
                boxY + 120,
              );

              // Line 4: Date/Time
              ctx.fillText(
                `${dateStr} ${timeStr} GMT +05:30`,
                textX,
                boxY + 155,
              );

              setImgSrc(canvas.toDataURL("image/jpeg", 0.95));
              setLoading(false);
            };
          };
        } catch (err) {
          setLoading(false);
          alert("Check internet connection for Map/Address");
        }
      },
      (err) => setLoading(false),
      { enableHighAccuracy: true },
    );
  }, [webcamRef, loading]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="h-full w-full object-cover"
        playsInline
      />

      <div className="absolute bottom-10">
        <button
          onClick={capture}
          disabled={loading}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-95"
        >
          <div
            className={`w-16 h-16 rounded-full ${loading ? "bg-gray-500 animate-pulse" : "bg-white"}`}
          />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {imgSrc && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between p-6 bg-gray-900 border-b border-gray-800">
            <button
              onClick={() => setImgSrc(null)}
              className="text-white text-lg"
            >
              Retake
            </button>
            <a
              href={imgSrc}
              download="GPS_Photo.jpg"
              className="text-blue-400 font-bold text-lg"
            >
              Save to Gallery
            </a>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={imgSrc}
              className="max-w-full max-h-full rounded-xl shadow-2xl"
              alt="preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GpsCamera;
