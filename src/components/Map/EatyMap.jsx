import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Map, { Popup, NavigationControl, Source, Layer, Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../../api/backend';
import 'mapbox-gl/dist/mapbox-gl.css';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';

// eslint-disable-next-line import/no-webpack-loader-syntax
const MapboxWorker = require('mapbox-gl/dist/mapbox-gl-csp-worker').default;
mapboxgl.workerClass = MapboxWorker;

// 🛡️ THE FIX: Load the pure worker from our own domain's public folder
mapboxgl.workerUrl = '/mapbox-worker.js';

// Token Authentication is handled via environment variable and imported from backend.js for consistency across the app
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

// Cavite Province bounds (approximate)
const CAVITE_BOUNDS = {
  north: 14.60,
  south: 13.80,
  west: 120.50,
  east: 121.10,
};

// Default center on Cavite, Philippines
const DEFAULT_VIEW_STATE = {
  longitude: 120.9333,
  latitude: 14.2833,
  zoom: 11,
};

// MAPBOX_TOKEN is imported from backend.js for environment consistency

const EatyMap = ({
  setCoordinates,
  setBounds,
  coordinates,
  places = [],
  setChildClicked,
  uploads = [],
  ownerPlaces = [],
  mapFocus = null,
}) => {
  const mapRef = useRef();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [userLocation, setUserLocation] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);

  useEffect(() => {
    if (typeof mapboxgl.setTelemetryEnabled === 'function') {
      mapboxgl.setTelemetryEnabled(false);
    }

    const fetchHeatmap = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_URL || '';
        const response = await fetch(`${baseUrl}/api/trends/heatmap`);
        if (!response.ok) throw new Error('Failed to fetch heatmap data');

        const data = await response.json();
        // Ensure data is a valid GeoJSON object, not an HTML string or empty
        if (data && typeof data === 'object' && data.type === 'FeatureCollection') {
          setHeatmapData(data);
        }
      } catch (e) {
        console.error('Failed to load heatmap:', e);
      }
    };
    fetchHeatmap();
  }, []);

  // Use ownerPlaces from props (provided by AuthContext via MainApp)
  const locations = useMemo(() => {
    return (Array.isArray(ownerPlaces) ? ownerPlaces : []).filter(
      (place) => place?.lat !== null && place?.lng !== null && place.approval_status === 'approved'
    );
  }, [ownerPlaces]);

  const geojson = useMemo(() => {
    const features = [];

    // 1. Approved Restaurants (primary)
    locations.forEach(p => features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(p.lng), Number(p.lat)] },
      properties: {
        ...p,
        type: 'restaurant',
        isRestaurant: true
      }
    }));

    // 2. Uploads (community posts)
    (Array.isArray(uploads) ? uploads : []).filter(u => u?.lat && u?.lng).forEach(u => features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(u.lng), Number(u.lat)] },
      properties: {
        ...u,
        type: 'upload',
        isUpload: true
      }
    }));

    // 3. Legacy Owner Places
    (Array.isArray(ownerPlaces) ? ownerPlaces : []).filter(p => p?.lat && p?.lng && p.approval_status !== 'approved').forEach(p => features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(p.lng), Number(p.lat)] },
      properties: {
        ...p,
        type: 'pending_restaurant',
        isPending: true
      }
    }));

    return { type: 'FeatureCollection', features };
  }, [locations, uploads, ownerPlaces]);

  const clusterLayer = {
    id: 'clusters',
    type: 'circle',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40]
    }
  };

  const clusterCountLayer = {
    id: 'cluster-count',
    type: 'symbol',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  };

  const unclusteredPointLayer = {
    id: 'unclustered-point',
    type: 'circle',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'type'],
        'restaurant', '#165534',
        'upload', '#ef4444',
        'pending_restaurant', '#f59e0b',
        '#165534' // default
      ],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  };

  const loading = false; // Data is loaded via AuthContext

  const heatmapLayer = {
    id: 'heatmap',
    type: 'heatmap',
    maxzoom: 15,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 10, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0]
    }
  };

  const handleMapMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  const handleMapMoveEnd = useCallback((evt) => {
    const { latitude, longitude } = evt.viewState;

    if (setCoordinates) {
      setCoordinates({ lat: latitude, lng: longitude });
    }

    if (setBounds && mapRef.current) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      setBounds({
        ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
        sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng }
      });
    }
  }, [setCoordinates, setBounds]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setViewState((prev) => ({
          ...prev,
          latitude,
          longitude,
          zoom: 14,
          transitionDuration: 1000
        }));
        setUserLocation({ lat: latitude, lng: longitude });
        if (setCoordinates) setCoordinates({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Location access is needed to find nearby spots.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };


  if (!MAPBOX_TOKEN) {
    return (
      <MapContainer>
        <div
          style={{
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: '#444',
            padding: 16,
            textAlign: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0 }}>
              Mapbox is not configured. Please set REACT_APP_MAPBOX_TOKEN in your .env file.
            </p>
            <small>
              You can still use the app, but the map will appear once you add the token and restart
              the dev server.
            </small>
          </div>
        </div>
      </MapContainer>
    );
  }

  return (
    <MapContainer>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMapMove}
        onMoveEnd={handleMapMoveEnd}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        maxBounds={[
          [CAVITE_BOUNDS.west, CAVITE_BOUNDS.south],
          [CAVITE_BOUNDS.east, CAVITE_BOUNDS.north],
        ]}
        onClick={(e) => {
          const feature = e.features?.[0];
          if (feature) {
            if (feature.layer.id === 'clusters') {
              const clusterId = feature.properties.cluster_id;
              const mapboxSource = mapRef.current.getMap().getSource('restaurants');
              if (!mapboxSource) return;
              mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
                setViewState((prev) => ({
                  ...prev,
                  longitude: feature.geometry.coordinates[0],
                  latitude: feature.geometry.coordinates[1],
                  zoom,
                  transitionDuration: 500
                }));
              });
            } else if (feature.layer.id === 'unclustered-point') {
              setSelectedPlace(feature.properties);
              if (setChildClicked) setChildClicked(feature.properties.id);
            }
          }
        }}
        interactiveLayerIds={['clusters', 'unclustered-point']}
      >
        <NavigationControl position="bottom-right" />

        <LocateMeButton onClick={handleLocateMe} title="Locate Me">
          <GpsFixedIcon />
        </LocateMeButton>

        {/* User Current Location Marker */}
        {userLocation && (
          <Marker
            latitude={userLocation.lat}
            longitude={userLocation.lng}
            anchor="bottom"
          >
            <div className="flex flex-col items-center" style={{ pointerEvents: 'none' }}>
              <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-white animate-pulse">
                <MyLocationIcon fontSize="small" />
              </div>
              <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5 shadow-sm"></div>
            </div>
          </Marker>
        )}

        <Source
          id="restaurants"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>

        {heatmapData && (
          <Source id="heatmap-source" type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: 'rgba(255,255,255,0.9)',
              padding: '8px 12px',
              borderRadius: 4,
              fontSize: 12,
              zIndex: 10,
            }}
          >
            Loading restaurants...
          </div>
        )}

        {/* Popup for selected place */}
        {selectedPlace && (
          <Popup
            longitude={Number(selectedPlace.lng || selectedPlace.longitude)}
            latitude={Number(selectedPlace.lat || selectedPlace.latitude)}
            anchor="top"
            onClose={() => setSelectedPlace(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <PopupContent>
              <h4>{selectedPlace.name}</h4>
              <p>{selectedPlace.description || 'No description available'}</p>
              {selectedPlace.address && (
                <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
                  {selectedPlace.address}
                </small>
              )}
              {selectedPlace.has_vegan_items && (
                <small style={{ color: '#2e7d32', display: 'block', marginTop: 4 }}>
                  Vegan options available
                </small>
              )}
            </PopupContent>
          </Popup>
        )}
      </Map>
    </MapContainer>
  );
};

// Styled Components
const MapContainer = styled('div')({
  position: 'relative',
  overflow: 'hidden',
  height: '70vh',
  width: '100%',
  background: 'linear-gradient(to bottom, #3a1c71, #d76d77, #ffaf7b)',
  borderRadius: '8px',
  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
});

const LocateMeButton = styled('button')({
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '40px',
  height: '40px',
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--bg-tertiary)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 100,
  color: 'var(--brand-accent)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
});


const PopupContent = styled('div')({
  padding: '8px 12px',
  minWidth: '200px',
  '& h4': {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
  },
  '& p': {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.4,
  },
});

export default EatyMap;
