import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Map, { Popup, NavigationControl, Source, Layer, Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../../api/backend';
import 'mapbox-gl/dist/mapbox-gl.css';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

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
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
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
      'circle-color': ['step', ['get', 'point_count'], '#2e6b30', 10, '#b4491a', 30, '#7a2f12'],
      'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 32],
      'circle-stroke-width': 3,
      'circle-stroke-color': 'rgba(255,255,255,0.85)'
    }
  };

  const clusterCountLayer = {
    id: 'cluster-count',
    type: 'symbol',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 13
    },
    paint: {
      'text-color': '#ffffff'
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
        'restaurant', '#2e6b30',
        'upload', '#b4491a',
        'pending_restaurant', '#c99a1c',
        '#2e6b30' // default
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
            color: 'var(--text-secondary)',
            padding: 16,
            textAlign: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0 }}>
              The map isn't available right now.
            </p>
            <small>
              Nearby restaurants above still work. (Mapbox token missing: set REACT_APP_MAPBOX_TOKEN.)
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
        // On touch screens one finger scrolls the page; two fingers move the map.
        cooperativeGestures={isTouch}
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

        <LocateMeButton type="button" onClick={handleLocateMe} title="Show my location" aria-label="Show my location on the map">
          <GpsFixedIcon fontSize="small" />
        </LocateMeButton>

        <MapLegend aria-label="Map legend">
          <li><span style={{ background: '#2e6b30' }} />Restaurant</li>
          <li><span style={{ background: '#b4491a' }} />Community post</li>
          <li><span style={{ background: '#c99a1c' }} />Pending review</li>
        </MapLegend>

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
              <h4>{selectedPlace.name || selectedPlace.caption || 'Food spot'}</h4>
              {selectedPlace.description && <p>{selectedPlace.description}</p>}
              {selectedPlace.address && <small>{selectedPlace.address}</small>}
              {(selectedPlace.has_vegan_items === true || selectedPlace.has_vegan_items === 'true') && (
                <small className="vegan">Vegan options available</small>
              )}
              {selectedPlace.type === 'restaurant' && selectedPlace.id != null && (
                <Link to={`/restaurants/${selectedPlace.id}`} className="popup-link">View restaurant →</Link>
              )}
              {selectedPlace.type === 'upload' && selectedPlace.id != null && (
                <Link to={`/post/${selectedPlace.id}`} className="popup-link">View post →</Link>
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
  height: 'clamp(360px, 60vh, 660px)',
  width: '100%',
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-subtle)',
  boxShadow: 'var(--shadow-md)',
});

const MapLegend = styled('ul')({
  position: 'absolute',
  left: 12,
  bottom: 36,
  zIndex: 5,
  margin: 0,
  padding: '8px 12px',
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-sm)',
  fontSize: 12,
  fontWeight: 600,
  '& li': { display: 'flex', alignItems: 'center', gap: 8 },
  '& span': { width: 10, height: 10, borderRadius: '50%', boxShadow: '0 0 0 2px #fff' },
});

const LocateMeButton = styled('button')({
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '44px',
  height: '44px',
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 100,
  color: 'var(--accent)',
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
  padding: '14px 40px 14px 16px',
  minWidth: '220px',
  maxWidth: '280px',
  '& h4': {
    margin: '0 0 6px 0',
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 600,
    lineHeight: 1.2,
    color: 'var(--text-primary)',
  },
  '& p': {
    margin: '0 0 6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  '& small': { display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 },
  '& small.vegan': { color: 'var(--accent)', fontWeight: 600 },
  '& .popup-link': {
    display: 'inline-block',
    marginTop: 10,
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--accent)',
    textDecoration: 'none',
  },
  '& .popup-link:hover': { textDecoration: 'underline' },
});

export default EatyMap;
