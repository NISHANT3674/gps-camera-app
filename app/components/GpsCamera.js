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

        // Formatting Date to match your screenshot
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        const fullTimestamp = `${dateStr} ${timeStr} GMT +05:30`;

        try {
          // 1. Fetch real Address (Reverse Geocode)
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          const geoData = await geoRes.json();
          const line1 = `${geoData.city}, ${geoData.principalSubdivision}, India 🇮🇳`;
          const line2 = `${geoData.locality || ""}, ${geoData.city}, ${geoData.postcode || ""}`;

          // 2. Prepare Images
          const screenshot = webcamRef.current.getScreenshot();
          const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&z=16&l=sat&size=200,200`;

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

              // Draw Photo
              ctx.drawImage(mainImg, 0, 0);

              // 3. Draw Rounded Overlay Box (Bottom)
              const boxW = canvas.width * 0.92;
              const boxH = 180;
              const x = (canvas.width - boxW) / 2;
              const y = canvas.height - boxH - 40;

              ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
              ctx.beginPath();
              ctx.roundRect(x, y, boxW, boxH, 25);
              ctx.fill();

              // 4. Draw Rounded Map
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(x + 20, y + 20, 140, 140, 20);
              ctx.clip();
              ctx.drawImage(mapImg, x + 20, y + 20, 140, 140);
              ctx.restore();

              // 5. Draw Text (White)
              ctx.fillStyle = "white";
              ctx.font = "bold 28px sans-serif";
              ctx.fillText(line1, x + 180, y + 55);

              ctx.font = "20px sans-serif";
              ctx.fillStyle = "#e0e0e0";
              ctx.fillText(line2, x + 180, y + 90);

              ctx.font = "18px sans-serif";
              ctx.fillText(
                `Lat ${latitude.toFixed(6)}° Long ${longitude.toFixed(6)}°`,
                x + 180,
                y + 125,
              );
              ctx.fillText(fullTimestamp, x + 180, y + 155);

              setImgSrc(canvas.toDataURL("image/jpeg", 0.95));
              setLoading(false);
            };
          };
        } catch (err) {
          alert("Error fetching map or address");
          setLoading(false);
        }
      },
      (err) => {
        alert("Please enable Location services");
        setLoading(false);
      },
      { enableHighAccuracy: true },
    );
  }, [webcamRef, loading]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* 1. Full Screen Camera Feed */}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="h-full w-full object-cover"
        playsInline
      />

      {/* 2. Floating Shutter Button */}
      <div className="absolute bottom-10 flex flex-col items-center">
        <button
          onClick={capture}
          disabled={loading}
          className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all 
            ${loading ? "bg-gray-600" : "bg-transparent active:scale-90"}`}
        >
          <div
            className={`w-16 h-16 rounded-full ${loading ? "bg-gray-400" : "bg-white"}`}
          />
        </button>
      </div>

      {/* 3. Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 4. Full-Screen Preview Overlay (Appears after capture) */}
      {imgSrc && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center p-4">
          <div className="flex justify-between w-full mb-4 px-4">
            <button
              onClick={() => setImgSrc(null)}
              className="text-white text-lg"
            >
              Retake
            </button>
            <h2 className="text-white font-bold text-lg">Photo Saved</h2>
            <a
              href={imgSrc}
              download={`GPS_${Date.now()}.jpg`}
              className="text-blue-400 text-lg font-bold"
            >
              Save
            </a>
          </div>
          <img
            src={imgSrc}
            alt="Final"
            className="rounded-lg shadow-2xl max-h-[80%]"
          />
          <p className="text-gray-400 mt-4 text-center text-sm">
            Tap "Save" to keep this in your gallery
          </p>
        </div>
      )}
    </div>
  );
};

export default GpsCamera;
