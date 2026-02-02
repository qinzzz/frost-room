import { WeatherData, WeatherCondition, WeatherIntensity } from "../types";

/**
 * Fetches the current weather for a given location using the Open-Meteo API.
 * This API is free for non-commercial use and requires no API key.
 * Docs: https://open-meteo.com/en/docs
 */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        const weatherCode = data.current_weather?.weathercode;

        // Map WMO Weather interpretation codes (WW) to our 4 types + intensity
        // https://open-meteo.com/en/docs
        return mapWmoCodeToWeatherData(weatherCode);

    } catch (error) {
        console.error("Failed to fetch weather:", error);
        // Default to sunny/clear if API fails
        return { condition: 'sunny', intensity: 'light' };
    }
}

/**
 * Maps WMO Weather Codes to our simplified WeatherData.
 */
function mapWmoCodeToWeatherData(code: number): WeatherData {
    if (code === undefined || code === null) return { condition: 'sunny', intensity: 'light' };

    // Sunny / Clear
    if (code === 0 || code === 1) {
        return { condition: 'sunny', intensity: 'light' };
    }

    // Cloudy
    if (code === 2) return { condition: 'cloudy', intensity: 'light' };
    if (code === 3) return { condition: 'cloudy', intensity: 'moderate' };
    if (code === 45 || code === 48) return { condition: 'cloudy', intensity: 'heavy' }; // Fog is heavy cloudy

    // Drizzle (Rainy - Light)
    if ([51, 56, 61, 66, 80].includes(code)) {
        return { condition: 'rainy', intensity: 'light' };
    }

    // Rain (Rainy - Moderate)
    if ([53, 63].includes(code)) {
        return { condition: 'rainy', intensity: 'moderate' };
    }

    // Heavy Rain / Thunderstorm (Rainy - Heavy)
    if ([55, 57, 65, 67, 81, 82, 95, 96, 99].includes(code)) {
        return { condition: 'rainy', intensity: 'heavy' };
    }

    // Snow - Light
    if ([71, 77, 85].includes(code)) {
        return { condition: 'snowy', intensity: 'light' };
    }

    // Snow - Moderate
    if ([73].includes(code)) {
        return { condition: 'snowy', intensity: 'moderate' };
    }

    // Snow - Heavy
    if ([75, 86].includes(code)) {
        return { condition: 'snowy', intensity: 'heavy' };
    }

    return { condition: 'sunny', intensity: 'light' };
}
