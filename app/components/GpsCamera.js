"use client";
import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const GpsCamera = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  // This is the configuration for the mobile camera
  const videoConstraints = {
    facingMode: "environment", // Uses the back camera
    width: 1280,
    height: 720,
  };

  return (
    <div className="flex flex-col items-center p-4 bg-black min-h-screen text-white">
      <h1 className="text-xl font-bold mb-4">GPS Map Camera</h1>

      <div className="relative rounded-lg overflow-hidden border-2 border-gray-700">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full max-w-md"
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={() => alert("Ready for Step 3: The Capture Logic!")}
        className="mt-6 bg-blue-600 px-8 py-3 rounded-full font-bold active:scale-95 transition-transform"
      >
        Capture Photo
      </button>

      {imgSrc && (
        <div className="mt-4 border border-white p-2">
          <p className="text-sm mb-2">Preview:</p>
          <img src={imgSrc} alt="Captured" className="w-64" />
        </div>
      )}
    </div>
  );
};

export default GpsCamera;
