"use client";
import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const GpsCamera = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  const capture = useCallback(() => {
    if (!navigator.geolocation) return alert("Geolocation not supported");

    setLoading(true); // Optional: add a loading state

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const dateStr = new Date().toLocaleString();

        // 1. Prepare the Static Map URL (Satellite Style)
        // Using a free tier service (Replace YOUR_MAPBOX_TOKEN if you use Mapbox)
        const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&z=15&l=sat&size=150,150`;

        const imageSrc = webcamRef.current.getScreenshot();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        const mapImg = new Image();

        img.src = imageSrc;
        // CrossOrigin is needed to allow canvas to "export" the map image
        mapImg.crossOrigin = "anonymous";
        mapImg.src = mapUrl;

        // Wait for both images to load
        img.onload = () => {
          mapImg.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw Main Photo
            ctx.drawImage(img, 0, 0);

            // Draw Overlay Bar
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(0, canvas.height - 160, canvas.width, 160);

            // DRAW THE MAP (on the left)
            ctx.drawImage(mapImg, 20, canvas.height - 140, 120, 120);

            // DRAW TEXT (beside the map)
            ctx.fillStyle = "white";
            ctx.font = "bold 22px Arial";
            ctx.fillText(`GPS LOCATION`, 160, canvas.height - 110);

            ctx.font = "16px Arial";
            ctx.fillText(
              `Lat: ${latitude.toFixed(6)}`,
              160,
              canvas.height - 80,
            );
            ctx.fillText(
              `Long: ${longitude.toFixed(6)}`,
              160,
              canvas.height - 55,
            );
            ctx.fillText(dateStr, 160, canvas.height - 30);

            const finalDataUrl = canvas.toDataURL("image/jpeg", 0.9);
            setImgSrc(finalDataUrl);
            setLoading(false);
          };
        };
      },
      (err) => alert(err.message),
      { enableHighAccuracy: true },
    );
  }, [webcamRef]);
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
        className="mt-6 bg-red-600 w-16 h-16 rounded-full border-4 border-white active:scale-90 transition-all"
      />

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
