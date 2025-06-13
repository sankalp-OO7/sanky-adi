import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber'; // Add useThree
import { Image, ScrollControls, Scroll, useScroll } from '@react-three/drei';
import * as THREE from 'three';

// Import your image assets.
// You'll need to replace these with your actual image paths.
const imagePaths = [
  'https://placehold.co/300x200/FF0000/FFFFFF?text=Image+1',
  'https://placehold.co/250x350/00FF00/000000?text=Image+2',
  'https://placehold.co/400x250/0000FF/FFFFFF?text=Image+3',
  'https://placehold.co/200x400/FFFF00/000000?text=Image+4',
  'https://placehold.co/350x280/FF00FF/FFFFFF?text=Image+5',
  'https://placehold.co/280x320/00FFFF/000000?text=Image+6',
  'https://placehold.co/300x300/F0F0F0/000000?text=Image+7',
  'https://placehold.co/200x200/ABCDEF/000000?text=Image+8',
  'https://placehold.co/380x220/FEDCBA/FFFFFF?text=Image+9',
  'https://placehold.co/260x300/123456/FFFFFF?text=Image+10',
  'https://placehold.co/300x200/789ABC/000000?text=Image+11',
  'https://placehold.co/250x350/DEF123/FFFFFF?text=Image+12',
  'https://placehold.co/400x250/456789/000000?text=Image+13',
  'https://placehold.co/200x400/ABC987/FFFFFF?text=Image+14',
  'https://placehold.co/350x280/CBA321/000000?text=Image+15',
  'https://placehold.co/280x320/FEEBCC/FFFFFF?text=Image+16',
  'https://placehold.co/300x300/AABBCC/000000?text=Image+17',
  'https://placehold.co/200x200/DDCCAA/FFFFFF?text=Image+18',
  'https://placehold.co/380x220/EEFFDD/000000?text=Image+19',
  'https://placehold.co/260x300/112233/FFFFFF?text=Image+20',
  // Duplicate for infinite scroll illusion if needed
  'https://placehold.co/300x200/FF0000/FFFFFF?text=Image+1',
  'https://placehold.co/250x350/00FF00/000000?text=Image+2',
  'https://placehold.co/400x250/0000FF/FFFFFF?text=Image+3',
  'https://placehold.co/200x400/FFFF00/000000?text=Image+4',
  'https://placehold.co/350x280/FF00FF/FFFFFF?text=Image+5',
  'https://placehold.co/280x320/00FFFF/000000?text=Image+6',
  'https://placehold.co/300x300/F0F0F0/000000?text=Image+7',
  'https://placehold.co/200x200/ABCDEF/000000?text=Image+8',
  'https://placehold.co/380x220/FEDCBA/FFFFFF?text=Image+9',
  'https://placehold.co/260x300/123456/FFFFFF?text=Image+10',
];

// Helper function to get a random value within a range
const getRandom = (min, max) => Math.random() * (max - min) + min;

// Component to render individual images
function ImagePlane({ url, position, rotation, scale, ...props }) {
  const meshRef = useRef();

  return (
    <Image
      ref={meshRef}
      url={url}
      transparent
      opacity={0.95}
      position={position}
      rotation={rotation}
      scale={scale}
      {...props}
    />
  );
}

// NEW COMPONENT for Camera Controls and Zoom
function CameraControls({ zoomLevel }) {
  const { camera } = useThree(); // Get the default camera from the Canvas context

  useFrame(() => {
    // This useFrame is now correctly inside the Canvas context
    camera.fov = 75 / zoomLevel;
    camera.updateProjectionMatrix();
  });

  return null; // This component doesn't render any visible Three.js objects
}


// Main Moodboard 3D component
const Moodboard3D = () => {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = default zoom

  const numImages = imagePaths.length;
  const imageElements = imagePaths.map((path, i) => {
    const x = getRandom(-30, 30);
    const y = getRandom(-30, 30);
    const z = getRandom(-20, 20); // More negative means further away

    const s = getRandom(2, 8); // Image size varies more

    const rotX = getRandom(-0.1, 0.1);
    const rotY = getRandom(-0.1, 0.1);
    const rotZ = getRandom(-0.1, 0.1);

    return {
      url: path,
      position: [x, y, z],
      rotation: [rotX, rotY, rotZ],
      scale: [s * getRandom(0.8, 1.2), s * getRandom(0.8, 1.2), 1],
    };
  });

  // Handle Zoom: Mouse wheel event on the div container
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    setZoomLevel((prevZoom) => {
      let newZoom = prevZoom - event.deltaY * 0.001;
      newZoom = Math.max(0.1, Math.min(newZoom, 5));
      return newZoom;
    });
  }, []);

  useEffect(() => {
    const containerElement = document.querySelector('.moodboard-canvas'); // Listen on the container div
    if (containerElement) {
      containerElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (containerElement) {
        containerElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);


  return (
    <div className="moodboard-canvas">
      <Canvas
        camera={{ position: [0, 0, 35], fov: 75 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />

        {/* Place CameraControls inside the Canvas */}
        <CameraControls zoomLevel={zoomLevel} />

        <ScrollControls pages={imageElements.length * 0.1} infinite horizontal>
          <Scroll>
            {imageElements.map((image, index) => (
              <ImagePlane
                key={index}
                url={image.url}
                position={image.position}
                rotation={image.rotation}
                scale={image.scale}
              />
            ))}
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
};

export default Moodboard3D;