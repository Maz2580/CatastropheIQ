import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Globe, RotateCcw, Zap, MapPin } from 'lucide-react';

const GlobeView = ({ disasters = [], onEventSelect }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  // Enhanced globe drawing with 3D effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient for 3D sphere effect
      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3, 
        centerY - radius * 0.3, 
        0,
        centerX, 
        centerY, 
        radius
      );
      gradient.addColorStop(0, '#4fc3f7');
      gradient.addColorStop(0.7, '#1976d2');
      gradient.addColorStop(1, '#0d47a1');

      // Draw globe base
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Meridians
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30 + rotation) * (Math.PI / 180);
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY;
        const x2 = centerX - Math.cos(angle) * radius;
        const y2 = centerY;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(x1 - centerX), radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Parallels
      for (let i = 1; i < 6; i++) {
        const y = centerY + (radius / 3) * (i - 2.5);
        const ellipseRadius = Math.sqrt(Math.max(0, radius * radius - (y - centerY) * (y - centerY)));
        
        if (ellipseRadius > 0) {
          ctx.beginPath();
          ctx.ellipse(centerX, y, ellipseRadius, ellipseRadius * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw continents (simplified)
      ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
      drawContinents(ctx, centerX, centerY, radius, rotation);

      // Draw disasters as pulsing dots
      disasters.forEach((disaster, index) => {
        drawDisasterOnGlobe(ctx, disaster, centerX, centerY, radius, rotation, Date.now() / 1000 + index);
      });

      // Add atmosphere glow
      const atmosphereGradient = ctx.createRadialGradient(
        centerX, centerY, radius,
        centerX, centerY, radius + 20
      );
      atmosphereGradient.addColorStop(0, 'rgba(135, 206, 250, 0.3)');
      atmosphereGradient.addColorStop(1, 'rgba(135, 206, 250, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGradient;
      ctx.fill();

      if (isAutoRotating) {
        setRotation(prev => prev + 0.5);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [disasters, rotation, isAutoRotating]);

  const drawContinents = (ctx, centerX, centerY, radius, rotation) => {
    // Simplified continent shapes
    const continents = [
      // North America
      { lat: 45, lng: -100 + rotation, size: 30 },
      { lat: 35, lng: -95 + rotation, size: 25 },
      { lat: 25, lng: -80 + rotation, size: 15 },
      
      // Europe
      { lat: 55, lng: 10 + rotation, size: 20 },
      { lat: 45, lng: 15 + rotation, size: 18 },
      
      // Asia
      { lat: 35, lng: 105 + rotation, size: 35 },
      { lat: 55, lng: 90 + rotation, size: 30 },
      
      // Africa
      { lat: 0, lng: 20 + rotation, size: 25 },
      { lat: -20, lng: 25 + rotation, size: 22 },
      
      // Australia
      { lat: -25, lng: 135 + rotation, size: 12 }
    ];

    continents.forEach(continent => {
      const coords = latLngToXY(continent.lat, continent.lng, centerX, centerY, radius);
      if (coords.visible) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, continent.size * coords.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawDisasterOnGlobe = (ctx, disaster, centerX, centerY, radius, rotation, time) => {
    const lat = disaster.coordinates.coordinates[1];
    const lng = disaster.coordinates.coordinates[0] + rotation;
    
    const coords = latLngToXY(lat, lng, centerX, centerY, radius);
    
    if (coords.visible) {
      const pulse = Math.sin(time * 3) * 0.3 + 0.7;
      const size = (8 + disaster.damage_score / 10) * coords.scale * pulse;
      
      // Get disaster color
      const color = disaster.damage_score > 85 ? '#dc2626' : 
                   disaster.damage_score > 70 ? '#ea580c' : '#f59e0b';
      
      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(
        coords.x, coords.y, 0,
        coords.x, coords.y, size + 10
      );
      glowGradient.addColorStop(0, `${color}80`);
      glowGradient.addColorStop(1, `${color}00`);
      
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, size + 10, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
      
      // Draw main disaster dot
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw inner highlight
      ctx.beginPath();
      ctx.arc(coords.x - size * 0.3, coords.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    }
  };

  const latLngToXY = (lat, lng, centerX, centerY, radius) => {
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    
    const x = centerX + radius * Math.cos(latRad) * Math.cos(lngRad);
    const y = centerY - radius * Math.sin(latRad);
    
    // Check if point is on the visible side of the globe
    const visible = Math.cos(lngRad) > 0;
    
    // Scale factor for 3D effect
    const scale = Math.cos(lngRad) * 0.5 + 0.5;
    
    return { x, y, visible, scale };
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is near any disaster
    disasters.forEach(disaster => {
      const lat = disaster.coordinates.coordinates[1];
      const lng = disaster.coordinates.coordinates[0] + rotation;
      const coords = latLngToXY(lat, lng, canvas.width / 2, canvas.height / 2, 
                               Math.min(canvas.width, canvas.height) / 2 - 20);
      
      if (coords.visible) {
        const distance = Math.sqrt((x - coords.x) ** 2 + (y - coords.y) ** 2);
        if (distance < 15) {
          setSelectedDisaster(disaster);
          onEventSelect?.(disaster.event_id);
        }
      }
    });
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-blue-900 text-white border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Globe className="w-5 h-5 mr-2 text-blue-400" />
            Global Disaster View
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              {isAutoRotating ? <RotateCcw className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </Button>
            <Badge variant="secondary" className="bg-blue-600 text-white">
              {disasters.length} Active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full max-w-md mx-auto cursor-pointer"
            onClick={handleCanvasClick}
            style={{ maxHeight: '400px' }}
          />
          
          {selectedDisaster && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 p-3 rounded-lg max-w-xs">
              <h4 className="font-semibold text-sm mb-1">{selectedDisaster.title}</h4>
              <p className="text-xs text-gray-300 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Impact Radius: {selectedDisaster.coordinates.radius_km} km
              </p>
              <p className="text-xs text-gray-300">
                Damage Score: <span className="text-red-400 font-semibold">
                  {selectedDisaster.damage_score}/100
                </span>
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-300">
            Click on disaster markers for details • Auto-rotation: {isAutoRotating ? 'ON' : 'OFF'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobeView;