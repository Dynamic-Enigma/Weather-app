const baseWeatherUrl = "https://api.open-meteo.com/v1/forecast";
const geocodingUrl = "https://geocoding-api.open-meteo.com/v1/search";

document.getElementById("search-btn").addEventListener("click", () => {
  const city = document.getElementById("city").value.trim() || "Bhilai";
  fetchCoordinates(city);
});

document.getElementById("locate-btn").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeather(latitude, longitude, "Your Location");
    },
    () => {
      // If location access fails, use Bhilai as default
      fetchCoordinates("Bhilai");
    }
  );
});

async function fetchCoordinates(city) {
  try {
    const response = await fetch(`${geocodingUrl}?name=${city}`);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      alert("City not found!");
      return;
    }

    const { latitude, longitude, name } = data.results[0];
    fetchWeather(latitude, longitude, name);
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    alert("Failed to fetch city data!");
  }
}

async function fetchWeather(latitude, longitude, locationName) {
  try {
    const response = await fetch(
      `${baseWeatherUrl}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    const data = await response.json();

    // Update current weather
    const { temperature, windspeed, weathercode } = data.current_weather;
    document.getElementById("location").textContent = locationName;
    document.getElementById("temperature").textContent = `Temperature: ${temperature} °C`;
    document.getElementById("description").textContent = `Condition: ${getWeatherDescription(weathercode)}`;
    document.getElementById("humidity").textContent = `Humidity: Data Unavailable`;
    document.getElementById("wind-speed").textContent = `Wind Speed: ${windspeed} km/h`;

    // Update theme based on weather
    updateTheme(weathercode);

    // Update 7-day forecast
    const forecastContainer = document.getElementById("forecast");
    forecastContainer.innerHTML = ""; // Clear old forecast
    data.daily.time.forEach((date, index) => {
      const maxTemp = data.daily.temperature_2m_max[index];
      const minTemp = data.daily.temperature_2m_min[index];

      const forecastCard = document.createElement("div");
      forecastCard.classList.add("forecast-card");
      forecastCard.innerHTML = `
        <h4>${date}</h4>
        <p>Max: ${maxTemp} °C</p>
        <p>Min: ${minTemp} °C</p>
      `;
      forecastContainer.appendChild(forecastCard);
    });
  } catch (error) {
    console.error("Error fetching weather:", error);
    alert("Failed to fetch weather data!");
  }
}

function getWeatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear", 
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Light Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    80: "Rain Showers",
    95: "Thunderstorm",
  };
  return descriptions[code] || "Unknown";
}

function updateTheme(weathercode) {
  // Remove all existing weather classes
  document.body.classList.remove('sunny', 'cloudy', 'rainy', 'snowy', 'thunderstorm');
  
  // Add appropriate weather class based on weather code
  if (weathercode <= 1) {
    document.body.classList.add('sunny'); // Clear sky or mainly clear
  } else if (weathercode <= 3) {
    document.body.classList.add('cloudy'); // Partly cloudy or overcast
  } else if ([51, 53, 55, 61, 63, 65, 80].includes(weathercode)) {
    document.body.classList.add('rainy'); // Various rain conditions
  } else if ([71, 73, 75, 77, 85, 86].includes(weathercode)) {
    document.body.classList.add('snowy'); // Snow conditions
  } else if (weathercode === 95) {
    document.body.classList.add('thunderstorm'); // Thunderstorm
  } else {
    document.body.classList.add('cloudy'); // Default to cloudy for other codes
  }
}
