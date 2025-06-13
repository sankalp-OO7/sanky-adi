import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Image, ScrollControls, Scroll, useScroll } from '@react-three/drei';
import * as THREE from 'three';

// Generate placeholder images using canvas (works offline and with CSP)
const generatePlaceholderImage = (width, height, color, text) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, `${color}88`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = `${Math.min(width, height) / 8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toDataURL();
};

// Create diverse placeholder images
const imagePaths = [
  generatePlaceholderImage(300, 200, '#FF6B6B', 'Design 1'),
  generatePlaceholderImage(250, 300, '#4ECDC4', 'Art 2'),
  generatePlaceholderImage(280, 220, '#45B7D1', 'Photo 3'),
  generatePlaceholderImage(320, 240, '#96CEB4', 'Image 4'),
  generatePlaceholderImage(260, 280, '#FFEAA7', 'Visual 5'),
  generatePlaceholderImage(300, 250, '#DDA0DD', 'Mood 6'),
  generatePlaceholderImage(270, 290, '#98D8C8', 'Style 7'),
  generatePlaceholderImage(310, 210, '#F7DC6F', 'Inspire 8'),
  generatePlaceholderImage(290, 260, '#BB8FCE', 'Create 9'),
  generatePlaceholderImage(280, 270, '#85C1E9', 'Dream 10'),
  generatePlaceholderImage(320, 200, '#F8C471', 'Vision 11'),
  generatePlaceholderImage(250, 280, '#82E0AA', 'Idea 12'),
  generatePlaceholderImage(300, 290, '#F1948A', 'Concept 13'),
  generatePlaceholderImage(270, 230, '#85C1E9', 'Theme 14'),
  generatePlaceholderImage(290, 250, '#D2B4DE', 'Board 15'),
  generatePlaceholderImage(310, 270, '#A3E4D7', 'Collage 16'),
  generatePlaceholderImage(260, 240, '#F9E79F', 'Gallery 17'),
  generatePlaceholderImage(280, 300, '#AED6F1', 'Mix 18'),
  generatePlaceholderImage(300, 220, '#ABEBC6', 'Blend 19'),
  generatePlaceholderImage(290, 280, '#F5B7B1', 'Fusion 20'),
];

// Helper functions
const getRandom = (min, max) => Math.random() * (max - min) + min;
const lerp = (start, end, factor) => start + (end - start) * factor;

// Enhanced ImagePlane component with error handling and better animations
function ImagePlane({ url, position, rotation, scale, index, scrollOffset }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Create floating animation
  const floatOffset = useMemo(() => ({
    x: getRandom(-0.5, 0.5),
    y: getRandom(-0.3, 0.3),
    z: getRandom(-0.2, 0.2),
    speed: getRandom(0.5, 1.5),
    amplitude: getRandom(0.3, 0.8)
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      // Floating animation
      meshRef.current.position.x = position[0] + Math.sin(time * floatOffset.speed + index) * floatOffset.amplitude * floatOffset.x;
      meshRef.current.position.y = position[1] + Math.cos(time * floatOffset.speed * 0.7 + index) * floatOffset.amplitude * floatOffset.y;
      
      // Parallax effect based on scroll
      meshRef.current.position.z = position[2] + scrollOffset * 0.1 * (index % 3 - 1);
      
      // Hover effect
      const targetScale = hovered ? 1.1 : clicked ? 0.95 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          scale[0] * targetScale,
          scale[1] * targetScale,
          scale[2]
        ),
        0.1
      );
      
      // Subtle rotation animation
      meshRef.current.rotation.z = rotation[2] + Math.sin(time * 0.3 + index) * 0.02;
    }
  });

  // Fallback to colored plane if image fails
  if (imageError) {
    return (
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => setClicked(true)}
        onPointerUp={() => setClicked(false)}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          color={`hsl(${index * 30}, 70%, 60%)`} 
          transparent 
          opacity={hovered ? 1 : 0.8}
        />
      </mesh>
    );
  }

  return (
    <Image
      ref={meshRef}
      url={url}
      transparent
      opacity={hovered ? 1 : 0.9}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => setClicked(true)}
      onPointerUp={() => setClicked(false)}
      onError={() => setImageError(true)}
    />
  );
}

ImagePlane.propTypes = {
  url: PropTypes.string.isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  rotation: PropTypes.arrayOf(PropTypes.number).isRequired,
  scale: PropTypes.arrayOf(PropTypes.number).isRequired,
  index: PropTypes.number.isRequired,
  scrollOffset: PropTypes.number.isRequired,
};

// Enhanced camera controls with smooth zoom and pan
function CameraControls({ zoomLevel, panOffset, targetPosition }) {
  const { camera } = useThree();
  const currentPosition = useRef([0, 0, 35]);
  
  useFrame(() => {
    // Smooth zoom
    camera.fov = lerp(camera.fov, 75 / zoomLevel, 0.1);
    camera.updateProjectionMatrix();
    
    // Smooth camera movement
    currentPosition.current[0] = lerp(
      currentPosition.current[0],
      targetPosition[0] + panOffset.x,
      0.1
    );
    currentPosition.current[1] = lerp(
      currentPosition.current[1],
      targetPosition[1] + panOffset.y,
      0.1
    );
    currentPosition.current[2] = lerp(
      currentPosition.current[2],
      targetPosition[2],
      0.1
    );
    
    camera.position.set(...currentPosition.current);
  });

  return null;
}

CameraControls.propTypes = {
  zoomLevel: PropTypes.number.isRequired,
  panOffset: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
  targetPosition: PropTypes.arrayOf(PropTypes.number).isRequired,
};

// Scroll indicator component
function ScrollIndicator({ scrollProgress }) {
  return (
    <div 
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '4px',
        height: '100px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          height: `${scrollProgress * 100}%`,
          background: 'linear-gradient(to bottom, #ff6b6b, #4ecdc4)',
          borderRadius: '2px',
          transition: 'height 0.1s ease'
        }}
      />
    </div>
  );
}

ScrollIndicator.propTypes = {
  scrollProgress: PropTypes.number.isRequired,
};

// Main Moodboard 3D component with error boundary
const Moodboard3D = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState([0, 0, 35]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasError, setCanvasError] = useState(null);
  const canvasRef = useRef();

  // Generate optimized image layout for stacking effect
  const imageElements = useMemo(() => {
    return imagePaths.map((path, i) => {
      const layer = Math.floor(i / 5); // Group images in smaller layers
      const indexInLayer = i % 5;
      
      // Create stacked layout similar to the screenshot
      const angle = (indexInLayer / 5) * Math.PI * 2;
      const radius = 12 + layer * 6;
      
      const x = Math.cos(angle) * radius + getRandom(-4, 4);
      const y = Math.sin(angle) * radius + getRandom(-4, 4);
      const z = layer * -3 + getRandom(-2, 2);
      
      // Vary sizes for visual interest
      const baseSize = 3 + Math.random() * 2;
      const aspectRatio = getRandom(0.8, 1.3);
      
      return {
        url: path,
        position: [x, y, z],
        rotation: [
          getRandom(-0.1, 0.1),
          getRandom(-0.1, 0.1),
          getRandom(-0.2, 0.2)
        ],
        scale: [
          baseSize * aspectRatio,
          baseSize,
          1
        ],
      };
    });
  }, []);

  // Enhanced wheel handler for smooth zooming
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
    setZoomLevel((prevZoom) => {
      const zoomSpeed = 0.002;
      const newZoom = prevZoom - event.deltaY * zoomSpeed;
      return Math.max(0.3, Math.min(newZoom, 8));
    });
  }, []);

  // Mouse drag handlers for panning
  const handleMouseDown = useCallback((event) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging) return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    setPanOffset({
      x: deltaX * 0.05,
      y: -deltaY * 0.05
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Smoothly return to center
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Keyboard controls for navigation
  const handleKeyDown = useCallback((event) => {
    const moveSpeed = 2;
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
        setTargetPosition((prev) => [prev[0], prev[1] + moveSpeed, prev[2]]);
        break;
      case 'ArrowDown':
      case 's':
        setTargetPosition((prev) => [prev[0], prev[1] - moveSpeed, prev[2]]);
        break;
      case 'ArrowLeft':
      case 'a':
        setTargetPosition((prev) => [prev[0] - moveSpeed, prev[1], prev[2]]);
        break;
      case 'ArrowRight':
      case 'd':
        setTargetPosition((prev) => [prev[0] + moveSpeed, prev[1], prev[2]]);
        break;
      case ' ':
        event.preventDefault();
        setTargetPosition([0, 0, 35]);
        setZoomLevel(1);
        break;
      default:
        break;
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown]);

  // Scroll component with progress tracking
  function ScrollContent() {
    const scroll = useScroll();
    
    useFrame(() => {
      if (scroll) {
        setScrollProgress(scroll.offset);
      }
    });

    return (
      <Scroll>
        {imageElements.map((image, index) => (
          <ImagePlane
            key={index}
            url={image.url}
            position={image.position}
            rotation={image.rotation}
            scale={image.scale}
            index={index}
            scrollOffset={scroll?.offset || 0}
          />
        ))}
      </Scroll>
    );
  }

  // Error boundary for Canvas
  if (canvasError) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <div>
          <h2>WebGL Context Error</h2>
          <p>Unable to initialize 3D graphics. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid white',
              color: 'white',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={canvasRef}
      className="moodboard-canvas"
      style={{ 
        width: '100vw', 
        height: '100vh', 
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Controls UI */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        backdropFilter: 'blur(10px)'
      }}>
        <div>Mouse Wheel: Zoom</div>
        <div>Drag: Pan</div>
        <div>WASD/Arrows: Navigate</div>
        <div>Space: Reset</div>
        <div>Zoom: {zoomLevel.toFixed(2)}x</div>
      </div>

      <ScrollIndicator scrollProgress={scrollProgress} />

      <Canvas
        camera={{ position: [0, 0, 35], fov: 75 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false // Allow fallback
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        onError={(error) => {
          console.error('Canvas error:', error);
          setCanvasError(error);
        }}
        onCreated={(state) => {
          // Handle WebGL context lost
          state.gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost');
            setCanvasError('WebGL context lost');
          });
        }}
      >
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        <spotLight 
          position={[0, 0, 20]} 
          angle={0.3} 
          penumbra={0.5} 
          intensity={0.5}
          castShadow
        />

        <CameraControls 
          zoomLevel={zoomLevel} 
          panOffset={panOffset}
          targetPosition={targetPosition}
        />

        <ScrollControls 
          pages={6} 
          infinite 
          horizontal
          damping={0.2}
        >
          <ScrollContent />
        </ScrollControls>

        {/* Background gradient */}
        <mesh position={[0, 0, -50]} scale={[100, 100, 1]}>
          <planeGeometry />
          <meshBasicMaterial>
            <primitive 
              attach="map"
              object={new THREE.CanvasTexture((() => {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 256;
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
                gradient.addColorStop(0, '#1a1a2e');
                gradient.addColorStop(0.5, '#16213e');
                gradient.addColorStop(1, '#0f0f23');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 256, 256);
                return canvas;
              })())} 
            />
          </meshBasicMaterial>
        </mesh>
      </Canvas>
    </div>
  );
};

export default Moodboard3D;