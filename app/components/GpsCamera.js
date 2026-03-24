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
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        const fullTimestamp = `${dateStr} ${timeStr}`;

        try {
          // 1. Fetch Highly Detailed Address from Nominatim (OpenStreetMap)
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: { "Accept-Language": "en" },
            },
          );
          const geoData = await geoRes.json();

          // Extracting parts for the two-line address style
          const addr = geoData.address;
          const city = addr.city || addr.town || addr.village || "Junagadh";
          const state = addr.state || "Gujarat";
          const country = addr.country || "India";

          // Detailed line (Suburbs, Roads, Landmarks)
          const detailedLine = [
            addr.suburb,
            addr.neighbourhood,
            addr.residential,
            addr.road,
            addr.postcode,
          ]
            .filter(Boolean)
            .join(", ");

          const line1 = `${city}, ${state}, ${country} 🇮🇳`;
          const line2 = detailedLine || `${city}, India`;

          // 2. Prepare Images
          const screenshot = webcamRef.current.getScreenshot();
          // Using Yandex for Satellite View
          const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&z=16&l=sat&size=250,250`;

          const mainImg = new Image();
          const mapImg = new Image();
          mainImg.src = screenshot;

          mainImg.onload = () => {
            mapImg.crossOrigin = "anonymous";
            mapImg.src = mapUrl;
            mapImg.onload = () => {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext("2d");

              // Match canvas to real photo size
              canvas.width = mainImg.width;
              canvas.height = mainImg.height;

              // Draw Photo
              ctx.drawImage(mainImg, 0, 0);

              // 3. Draw The Modern Overlay Box (Bottom)
              const boxW = canvas.width;
              const boxH = 200; // Slightly taller for more text
              const x = 0;
              const y = canvas.height - boxH;

              // Gradient or Solid Semi-Transparent Black
              ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
              ctx.fillRect(x, y, boxW, boxH);

              // 4. Draw Rounded Map (Left Side)
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(20, y + 25, 150, 150, 15);
              ctx.clip();
              ctx.drawImage(mapImg, 20, y + 25, 150, 150);
              ctx.restore();

              // 5. Draw Text (Matching your Request)
              const textX = 190;
              ctx.fillStyle = "white";

              // Title Line (Bold)
              ctx.font = "bold 26px sans-serif";
              ctx.fillText(line1, textX, y + 55);

              // Detailed Address Line
              ctx.font = "18px sans-serif";
              ctx.fillStyle = "#ffffff";
              ctx.fillText(line2, textX, y + 90);

              // Lat/Long Line
              ctx.font = "18px sans-serif";
              ctx.fillText(
                `Lat ${latitude.toFixed(6)}° N  Long ${longitude.toFixed(6)}° W`,
                textX,
                y + 125,
              );

              // Timestamp Line
              ctx.fillText(`${fullTimestamp} GMT +05:30`, textX, y + 160);

              setImgSrc(canvas.toDataURL("image/jpeg", 0.95));
              setLoading(false);
            };

            // Fallback if Map fails
            mapImg.onerror = () => {
              console.error("Map failed to load");
              setLoading(false);
            };
          };
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      },
      (err) => {
        alert("Location permission denied.");
        setLoading(false);
      },
      { enableHighAccuracy: true },
    );
  }, [webcamRef, loading]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="h-full w-full object-cover"
        playsInline
      />

      <div className="absolute bottom-10 flex flex-col items-center">
        <button
          onClick={capture}
          disabled={loading}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-90 transition-all"
        >
          <div
            className={`w-16 h-16 rounded-full ${loading ? "bg-gray-500 animate-pulse" : "bg-white"}`}
          />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {imgSrc && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center">
          <div className="flex justify-between w-full p-6 bg-gray-900">
            <button
              onClick={() => setImgSrc(null)}
              className="text-white text-lg"
            >
              Retake
            </button>
            <a
              href={imgSrc}
              download={`GPS_Cam_${Date.now()}.jpg`}
              className="text-blue-400 text-lg font-bold"
            >
              Save to Gallery
            </a>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={imgSrc}
              alt="Final Result"
              className="rounded shadow-2xl max-w-full max-h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GpsCamera;
