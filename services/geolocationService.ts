export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export const getRobustLocation = (
    options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
): Promise<GeoLocation> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }

        const attempt = (highAccuracy: boolean) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                    });
                },
                (err) => {
                    if (highAccuracy && (err.code === 3 || err.code === 2)) {
                        // Fallback to low accuracy
                        console.log("High accuracy failed, falling back to coarse mode...");
                        attempt(false);
                    } else {
                        reject(err);
                    }
                },
                { ...options, enableHighAccuracy: highAccuracy }
            );
        };

        attempt(options.enableHighAccuracy ?? true);
    });
};
