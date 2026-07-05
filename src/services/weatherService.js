export async function fetchSoilTelemetry(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=soil_temperature_6cm,soil_moisture_3_to_9cm&daily=temperature_2m_max&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather telemetry HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching soil and weather telemetry from Open-Meteo:", error);
    return {
      error: true,
      message: error.message || "Failed to fetch remote meteorological data",
      hourly: {
        time: [],
        soil_temperature_6cm: [],
        soil_moisture_3_to_9cm: []
      },
      daily: {
        time: [],
        temperature_2m_max: []
      }
    };
  }
}