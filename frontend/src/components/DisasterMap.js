import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

const { BaseLayer, Overlay } = LayersControl;

// Custom disaster icons
const createDisasterIcon = (type, severity) => {
  const color = severity > 85 ? '#dc2626' : severity > 70 ? '#ea580c' : '#f59e0b';
  const size = severity > 85 ? 40 : severity > 70 ? 35 : 30;
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: pulse-disaster 2s infinite;
      ">
        <span style="color: white; font-size: ${size * 0.4}px; font-weight: bold;">
          ${type === 'Hurricane' ? '🌀' : type === 'Wildfire' ? '🔥' : type === 'Flood' ? '🌊' : type === 'Tornado' ? '🌪️' : '⚡'}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Heat intensity colors for claims density
const getHeatColor = (density) => {
  return density > 80 ? '#800026' :
         density > 60 ? '#BD0026' :
         density > 40 ? '#E31A1C' :
         density > 20 ? '#FC4E2A' :
         density > 10 ? '#FD8D3C' :
         density > 5  ? '#FEB24C' :
         density > 2  ? '#FED976' :
                        '#FFEDA0';
};

const DisasterMap = ({ disasters = [], onEventSelect, selectedEvent, claims = null }) => {
  const [mapCenter] = useState([39.8283, -98.5795]); // Center of US
  const [mapZoom] = useState(5);
  const [animatedDisasters, setAnimatedDisasters] = useState([]);
  const mapRef = useRef();

  useEffect(() => {
    // Add CSS animation for pulsing disaster markers
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-disaster {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.7;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .leaflet-container {
        font-family: 'Inter', sans-serif;
      }
      
      .custom-popup {
        font-family: 'Inter', sans-serif;
      }
      
      .custom-popup .leaflet-popup-content {
        margin: 8px 12px;
        line-height: 1.4;
      }
      
      .disaster-info {
        padding: 8px 0;
      }
      
      .disaster-title {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }
      
      .disaster-details {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 2px;
      }
      
      .severity-high {
        color: #dc2626;
        font-weight: 600;
      }
      
      .severity-medium {
        color: #ea580c;
        font-weight: 600;
      }
      
      .severity-low {
        color: #f59e0b;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
    
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    // Animate disasters appearing on the map
    if (disasters.length > 0) {
      setAnimatedDisasters([]);
      disasters.forEach((disaster, index) => {
        setTimeout(() => {
          setAnimatedDisasters(prev => [...prev, disaster]);
        }, index * 500);
      });
    }
  }, [disasters]);

  // Generate impact zones around disasters
  const generateImpactZones = (disaster) => {
    const { coordinates } = disaster;
    const lat = coordinates.coordinates[1];
    const lng = coordinates.coordinates[0];
    const radius = coordinates.radius_km * 1000; // Convert to meters
    
    return [
      {
        center: [lat, lng],
        radius: radius,
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.6
      },
      {
        center: [lat, lng],
        radius: radius * 0.6,
        color: '#ea580c',
        fillColor: '#ea580c',
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.7
      },
      {
        center: [lat, lng],
        radius: radius * 0.3,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
        weight: 3,
        opacity: 0.8
      }
    ];
  };

  // Generate claims heat zones
  const generateClaimsHeatZones = () => {
    if (!claims || !claims.claims) return [];
    
    // Mock heat zone data based on claims density
    const heatZones = [
      {
        positions: [
          [25.7617, -80.1918],
          [25.8617, -80.0918],
          [25.8617, -80.2918],
          [25.7617, -80.2918]
        ],
        density: 85,
        claimCount: 23
      },
      {
        positions: [
          [27.9506, -82.4572],
          [28.0506, -82.3572],
          [28.0506, -82.5572],
          [27.9506, -82.5572]
        ],
        density: 65,
        claimCount: 15
      },
      {
        positions: [
          [29.7604, -95.3698],
          [29.8604, -95.2698],
          [29.8604, -95.4698],
          [29.7604, -95.4698]
        ],
        density: 45,
        claimCount: 8
      }
    ];
    
    return heatZones;
  };

  const getSeverityClass = (score) => {
    return score > 85 ? 'severity-high' : score > 70 ? 'severity-medium' : 'severity-low';
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          </BaseLayer>
          
          <BaseLayer name="Street Map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </BaseLayer>
          
          <BaseLayer name="Dark Theme">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </BaseLayer>
          
          <BaseLayer name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanorama.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            />
          </BaseLayer>

          {/* Disaster Markers */}
          {animatedDisasters.map((disaster) => {
            const lat = disaster.coordinates.coordinates[1];
            const lng = disaster.coordinates.coordinates[0];
            const impactZones = generateImpactZones(disaster);
            
            return (
              <React.Fragment key={disaster.event_id}>
                <Overlay checked name={`${disaster.event_type} Impact Zones`}>
                  <div>
                    {impactZones.map((zone, index) => (
                      <Circle
                        key={`${disaster.event_id}-zone-${index}`}
                        center={zone.center}
                        radius={zone.radius}
                        pathOptions={zone}
                      />
                    ))}
                  </div>
                </Overlay>
                
                <Marker
                  position={[lat, lng]}
                  icon={createDisasterIcon(disaster.event_type, disaster.damage_score)}
                  eventHandlers={{
                    click: () => onEventSelect?.(disaster.event_id),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="disaster-info">
                      <div className="disaster-title">{disaster.title}</div>
                      <div className="disaster-details">
                        <strong>Event ID:</strong> {disaster.event_id}
                      </div>
                      <div className="disaster-details">
                        <strong>Impact Radius:</strong> {disaster.coordinates.radius_km} km
                      </div>
                      <div className="disaster-details">
                        <strong>Damage Score:</strong> 
                        <span className={getSeverityClass(disaster.damage_score)}>
                          {disaster.damage_score}/100
                        </span>
                      </div>
                      <div className="disaster-details">
                        <strong>Confidence:</strong> 
                        <span className={getSeverityClass(disaster.confidence * 100)}>
                          {Math.round(disaster.confidence * 100)}%
                        </span>
                      </div>
                      <div className="disaster-details">
                        <strong>Status:</strong> 
                        <span style={{ 
                          color: disaster.status === 'active' ? '#dc2626' : '#6b7280',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {disaster.status}
                        </span>
                      </div>
                      {onEventSelect && (
                        <button
                          onClick={() => onEventSelect(disaster.event_id)}
                          style={{
                            marginTop: '8px',
                            padding: '4px 8px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Claims Heat Zones */}
          <Overlay name="Claims Density">
            <div>
              {generateClaimsHeatZones().map((zone, index) => (
                <Polygon
                  key={`heat-zone-${index}`}
                  positions={zone.positions}
                  pathOptions={{
                    color: getHeatColor(zone.density),
                    fillColor: getHeatColor(zone.density),
                    fillOpacity: 0.3,
                    weight: 2,
                    opacity: 0.8
                  }}
                >
                  <Popup>
                    <div>
                      <strong>Claims Density Zone</strong><br/>
                      Density: {zone.density}%<br/>
                      Active Claims: {zone.claimCount}
                    </div>
                  </Popup>
                </Polygon>
              ))}
            </div>
          </Overlay>
        </LayersControl>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
          <div className="text-sm font-semibold mb-2">Disaster Severity</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
              <span className="text-xs">Critical (85-100)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-600 rounded-full mr-2"></div>
              <span className="text-xs">High (70-84)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-xs">Moderate (50-69)</span>
            </div>
          </div>
        </div>
      </MapContainer>
    </div>
  );
};

export default DisasterMap;