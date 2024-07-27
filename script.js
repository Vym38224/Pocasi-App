document.getElementById('weather-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const city = document.getElementById('city').value;
    getWeather(city);
});

async function getWeather(city) {
    const apiKey = 'f1a2bbccc8027c7fe94b32c2829112d2'; // Nahraď tvým API klíčem
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=cz`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}&lang=cz`;

    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        if (!currentWeatherResponse.ok || !forecastResponse.ok) {
            throw new Error('Město nenalezeno nebo byl překročen limit API');
        }

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();
        displayWeather(currentWeatherData, forecastData);
    } catch (error) {
        alert(error.message);
    }
}

function displayWeather(currentWeatherData, forecastData) {
    const weatherResult = document.getElementById('weather-result');

    // Převod rychlosti větru z m/s na km/h
    const windSpeedKmh = (currentWeatherData.wind.speed * 3.6).toFixed(2);

    // Získání srážek
    const precipitation = currentWeatherData.rain ? currentWeatherData.rain['1h'] : 0;

    // Získání unikátních dat pro každý den
    const dailyForecasts = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD formát

        if (!dailyForecasts[dateKey] && date.getHours() >= 7 && date.getHours() <= 18) {
            dailyForecasts[dateKey] = item;
        }
    });

    weatherResult.innerHTML = `
        <h2>Aktuální počasí</h2>
        <p>Teplota: ${currentWeatherData.main.temp}°C</p>
        <p>Počasí: ${currentWeatherData.weather[0].description}</p>
        <p>Srážky: ${precipitation ? precipitation.toFixed(1) : '0.0'} mm</p>
        <p>Rychlost větru: ${windSpeedKmh} km/h</p>
        <h2>Předpověď na 5 dní (7:00 - 18:00)</h2>
        <ul>
            ${Object.values(dailyForecasts).slice(0, 5).map(item => {
                // Převod rychlosti větru z m/s na km/h
                const forecastWindSpeedKmh = (item.wind.speed * 3.6).toFixed(2);

                // Získání srážek
                const forecastPrecipitation = item.rain ? item.rain['3h'] : 0;

                return `
                <li>
                    <p>Datum: ${new Date(item.dt * 1000).toLocaleDateString()}</p>
                    <p>Čas: ${new Date(item.dt * 1000).toLocaleTimeString()}</p>
                    <p>Teplota: ${item.main.temp}°C</p>
                    <p>Počasí: ${item.weather[0].description}</p>
                    <p>Srážky: ${forecastPrecipitation ? forecastPrecipitation.toFixed(1) : '0.0'} mm</p>
                    <p>Rychlost větru: ${forecastWindSpeedKmh} km/h</p>
                    <button onclick="toggleHourlyForecast(${item.dt})">Zobrazit hodinovou předpověď</button>
                    <div id="hourly-${item.dt}" style="display: none;"></div>
                </li>`;
            }).join('')}
        </ul>
        <script id="forecast-data" type="application/json">${JSON.stringify(forecastData)}</script>
    `;
}

function toggleHourlyForecast(dateTime) {
    const hourlyDiv = document.getElementById(`hourly-${dateTime}`);
    if (hourlyDiv.style.display === 'none') {
        hourlyDiv.style.display = 'block';
        showHourlyForecast(dateTime);
    } else {
        hourlyDiv.style.display = 'none';
    }
}

function showHourlyForecast(dateTime) {
    const hourlyDiv = document.getElementById(`hourly-${dateTime}`);
    const forecastData = JSON.parse(document.getElementById('forecast-data').textContent);

    // Filtrujte pouze hodinové předpovědi mezi 7:00 a 18:00
    const hourlyData = forecastData.list.filter(item => {
        const date = new Date(item.dt * 1000);
        return date.getDate() === new Date(dateTime * 1000).getDate() &&
               date.getHours() >= 7 && date.getHours() <= 18;
    });

    hourlyDiv.innerHTML = `
        <h3>Hodinová předpověď</h3>
        <ul>
            ${hourlyData.map(item => `
                <li>
                    <p>Čas: ${new Date(item.dt * 1000).toLocaleTimeString()}</p>
                    <p>Teplota: ${item.main.temp}°C</p>
                    <p>Počasí: ${item.weather[0].description}</p>
                    <p>Srážky: ${item.rain ? item.rain['3h'].toFixed(1) : '0.0'} mm</p>
                    <p>Rychlost větru: ${(item.wind.speed * 3.6).toFixed(2)} km/h</p>
                </li>
            `).join('')}
        </ul>
    `;
}
