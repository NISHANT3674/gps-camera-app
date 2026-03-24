"use client";
import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const GpsCamera = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  const [loading, setLoading] = useState(false);

  const capture = useCallback(() => {
    if (loading) return; // Prevent double-clicking
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const dateStr = new Date().toLocaleString();

        // 1. Get the camera screenshot immediately
        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) {
          alert("Camera not ready");
          setLoading(false);
          return;
        }

        // 2. Prepare Map URL (Using Yandex for satellite)
        const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&z=15&l=sat&size=150,150`;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const mainImg = new Image();
        const mapImg = new Image();

        // Function to draw everything once images are ready
        const drawFinalPhoto = (includeMap = false) => {
          canvas.width = mainImg.width;
          canvas.height = mainImg.height;

          // Draw Main Photo
          ctx.drawImage(mainImg, 0, 0);

          // Draw Overlay Bar
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(0, canvas.height - 180, canvas.width, 180);

          let textXOffset = 30;

          // Draw Map if successful
          if (includeMap) {
            ctx.drawImage(mapImg, 20, canvas.height - 160, 130, 130);
            textXOffset = 170; // Move text to the right of the map
          }

          // Draw Text
          ctx.fillStyle = "white";
          ctx.font = "bold 24px Arial";
          ctx.fillText(`GPS LOCATION`, textXOffset, canvas.height - 130);

          ctx.font = "18px Arial";
          ctx.fillText(
            `Lat: ${latitude.toFixed(6)}`,
            textXOffset,
            canvas.height - 95,
          );
          ctx.fillText(
            `Long: ${longitude.toFixed(6)}`,
            textXOffset,
            canvas.height - 65,
          );
          ctx.fillText(dateStr, textXOffset, canvas.height - 35);

          setImgSrc(canvas.toDataURL("image/jpeg", 0.9));
          setLoading(false);
        };

        // Load Main Image
        mainImg.src = screenshot;
        mainImg.onload = () => {
          // Try to load Map
          mapImg.crossOrigin = "anonymous";
          mapImg.src = mapUrl;

          mapImg.onload = () => drawFinalPhoto(true);

          // If Map fails or takes > 3 seconds, draw without it
          mapImg.onerror = () => {
            console.log("Map failed to load, capturing without map");
            drawFinalPhoto(false);
          };

          setTimeout(() => {
            if (loading) drawFinalPhoto(false);
          }, 3000);
        };
      },
      (err) => {
        alert("Location Error: " + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true },
    );
  }, [webcamRef, loading]);
  return (
    <div className="flex flex-col items-center bg-black min-h-screen p-4 text-white">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="w-full max-w-md rounded-lg"
        playsInline
      />

      <button
        onClick={capture}
        disabled={loading}
        className={`mt-6 w-16 h-16 rounded-full border-4 border-white transition-all ${loading ? "bg-gray-500" : "bg-red-600 active:scale-90"}`}
      >
        {loading ? "..." : ""}
      </button>

      <canvas ref={canvasRef} className="hidden" />

      {imgSrc && (
        <div className="mt-6 flex flex-col items-center">
          <p className="mb-2 text-green-400">Photo Captured with GPS!</p>
          <img
            src={imgSrc}
            alt="Preview"
            className="w-full max-w-md border-2 border-white"
          />
          <a
            href={imgSrc}
            download="gps-photo.jpg"
            className="mt-4 bg-blue-500 px-6 py-2 rounded-lg font-bold"
          >
            Download to Gallery
          </a>
        </div>
      )}
    </div>
  );
};

export default GpsCamera;
