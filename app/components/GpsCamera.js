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
          month: "long",
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

          // Creating the specific lines like your example
          const line1 = `${a.city || a.town || a.village || "Junagadh"}, ${a.state || "Gujarat"}, India 🇮🇳`;

          // Combine building/road/suburb for the detailed line
          const line2 = [
            a.house_number,
            a.building,
            a.road,
            a.suburb,
            a.postcode,
          ]
            .filter(Boolean)
            .slice(0, 3)
            .join(", ");

          const screenshot = webcamRef.current.getScreenshot();
          // Updated Map URL for better centering
          const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&z=17&l=sat&size=300,300`;

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

              // --- LAYOUT CONSTANTS ---
              const boxH = 180;
              const boxY = canvas.height - boxH;

              // 3. Draw Dark Background
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              ctx.fillRect(0, boxY, canvas.width, boxH);

              // 4. Draw Map (Left Aligned & Center-Cropped)
              const mapSize = 140;
              const mapX = 20;
              const mapY = boxY + (boxH - mapSize) / 2; // Perfectly centered vertically in the box

              ctx.save();
              ctx.beginPath();
              ctx.roundRect(mapX, mapY, mapSize, mapSize, 15);
              ctx.clip();
              // Draw map larger and offset to ensure it's "centered"
              ctx.drawImage(mapImg, mapX, mapY, mapSize, mapSize);
              ctx.restore();

              // 5. Draw Text (With Overflow Prevention)
              ctx.fillStyle = "white";
              const textX = mapX + mapSize + 20;

              // Line 1: Bold City
              ctx.font = "bold 24px Arial";
              ctx.fillText(line1.substring(0, 35), textX, boxY + 45);

              // Line 2: Details (Smaller)
              ctx.font = "18px Arial";
              ctx.fillStyle = "#dddddd";
              ctx.fillText(line2.substring(0, 45), textX, boxY + 80);

              // Line 3: Lat/Long
              ctx.fillStyle = "white";
              ctx.fillText(
                `Lat ${latitude.toFixed(6)}° N  Long ${longitude.toFixed(6)}° E`,
                textX,
                boxY + 115,
              );

              // Line 4: Time
              ctx.fillText(`${dateStr} ${timeStr}`, textX, boxY + 150);

              setImgSrc(canvas.toDataURL("image/jpeg", 0.9));
              setLoading(false);
            };
          };
        } catch (err) {
          setLoading(false);
        }
      },
      (err) => setLoading(false),
      { enableHighAccuracy: true },
    );
  }, [webcamRef, loading]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center">
      <Webcam
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
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
        >
          <div
            className={`w-16 h-16 rounded-full ${loading ? "bg-gray-500 animate-pulse" : "bg-white"}`}
          />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {imgSrc && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between p-6 bg-gray-900 text-white">
            <button onClick={() => setImgSrc(null)}>Retake</button>
            <a
              href={imgSrc}
              download="GPS_Photo.jpg"
              className="font-bold text-blue-400"
            >
              Save Photo
            </a>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={imgSrc}
              className="max-w-full max-h-full rounded shadow-lg"
              alt="preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GpsCamera;
