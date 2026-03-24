"use client";
import React, { useRef, useState, useCallback } from 'react';
import Webcam from "react-webcam";

const GpsCamera = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  const capture = useCallback(() => {
    // 1. Get Location First
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const dateStr = new Date().toLocaleString();

      // 2. Capture the Screenshot from Webcam
      const imageSrc = webcamRef.current.getScreenshot();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        // Set canvas to match the photo size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the main photo
        ctx.drawImage(img, 0, 0);

        // 3. Draw the Semi-Transparent Overlay (Bottom Bar)
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, canvas.height - 140, canvas.width, 140);

        // 4. Draw the Text (GPS Data)
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText(`Lat: ${latitude.toFixed(4)}° N`, 30, canvas.height - 100);
        ctx.fillText(`Long: ${longitude.toFixed(4)}° W`, 30, canvas.height - 70);
        ctx.font = "16px Arial";
        ctx.fillText(dateStr, 30, canvas.height - 40);
        ctx.fillText("Junagadh, Gujarat, India", 30, canvas.height - 15); // You can use a Reverse Geocoding API later for real addresses

        // 5. Save the final result
        const finalDataUrl = canvas.toDataURL("image/jpeg");
        setImgSrc(finalDataUrl);
      };
    }, (error) => {
      alert("Error getting location: " + error.message);
    }, { enableHighAccuracy: true });
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
          <img src={imgSrc} alt="Preview" className="w-full max-w-md border-2 border-white" />
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