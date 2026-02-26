import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Loader2 } from 'lucide-react';

// Fix for default marker icons in Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map center when props change
const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

interface MapPanelProps {
    center: [number, number];
    radius: number;
    onLocationChange: (lat: number, lng: number) => void;
    editable?: boolean;
}

const MapSearch = ({ onSearchResult }: { onSearchResult: (lat: number, lng: number) => void }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const map = useMap();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                onSearchResult(newLat, newLng);
                map.setView([newLat, newLng], 16);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <form 
            onSubmit={handleSearch}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 p-1.5 bg-white dark:bg-[#0d0a1a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-[90%] max-w-sm"
        >
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search address or landmark..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl py-2 pl-9 pr-4 text-[11px] text-slate-900 dark:text-white focus:outline-none"
                />
            </div>
            <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
        </form>
    );
};

const LocationMarker = ({ position, onLocationChange, editable }: any) => {
    const map = useMapEvents({
        click(e) {
            if (editable) {
                onLocationChange(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    return position ? (
        <Marker position={position} />
    ) : null;
};

const MapPanel: React.FC<MapPanelProps> = ({ center, radius, onLocationChange, editable = true }) => {
    return (
        <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative z-0">
            <MapContainer
                center={center}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {editable && <MapSearch onSearchResult={onLocationChange} />}
                <LocationMarker position={center} onLocationChange={onLocationChange} editable={editable} />
                <Circle
                    center={center}
                    radius={radius}
                    pathOptions={{
                        fillColor: '#8252e9',
                        color: '#8252e9',
                        fillOpacity: 0.2
                    }}
                />
                <MapUpdater center={center} />
            </MapContainer>

            {!editable && (
                <div className="absolute inset-0 z-10 bg-transparent cursor-not-allowed" />
            )}
        </div>
    );
};

export default MapPanel;
