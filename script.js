document.getElementById('weather-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const city = document.getElementById('city').value;
    getWeather(city);
});

async function getWeather(city) {
    const apiKey = 'f1a2bbccc8027c7fe94b32c2829112d2'; // Replace with your API key
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=cz`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}&lang=cz`;

    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        if (!currentWeatherResponse.ok || !forecastResponse.ok) {
            throw new Error('Město nenalezeno nebo překročen limit API');
        }

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();
        displayWeather(currentWeatherData, forecastData);
        // Check if the weather is sunny
        if (currentWeatherData.weather[0].main.toLowerCase().includes('clear')) {
            showSun();
        }
        // Check if the weather is cloudy
        if (currentWeatherData.weather[0].main.toLowerCase().includes('cloud')) {
            showSun();
            showClouds();
            
        }
        // Check if the weather is rainy    
        if (currentWeatherData.weather[0].main.toLowerCase().includes('rain')) {
            showRain();
            showClouds();
        }
    } catch (error) {
        alert(error.message);
    }
}

function displayWeather(currentWeatherData, forecastData) {
    const weatherResult = document.getElementById('weather-result');

    // Convert wind speed from m/s to km/h
    const windSpeedKmh = (currentWeatherData.wind.speed * 3.6).toFixed(2);

    // Get precipitation
    const precipitation = currentWeatherData.rain ? currentWeatherData.rain['1h'] : 0;

    // Get unique data for each day
    const dailyForecasts = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!dailyForecasts[dateKey] && date.getHours() >= 7 && date.getHours() <= 18) {
            dailyForecasts[dateKey] = item;
        }
    });

    weatherResult.innerHTML = `
        <div id="current-weather-visuals" class="weather-background">
            <h2>Aktuální počasí pro ${currentWeatherData.name}</h2>
            <p>Teplota: ${currentWeatherData.main.temp}°C</p>
            <p>Počasí: ${currentWeatherData.weather[0].description}</p>
            <p>Srážky: ${precipitation ? precipitation.toFixed(1) : '0.0'} mm</p>
            <p>Rychlost větru: ${windSpeedKmh} km/h</p>
        
        </div>
        <div>
            <h2>5 denní předpověď</h2>
            <ul>
                ${Object.values(dailyForecasts).slice(0, 5).map(item => {
                    // Convert wind speed from m/s to km/h
                    const forecastWindSpeedKmh = (item.wind.speed * 3.6).toFixed(2);

                    // Get precipitation
                    const forecastPrecipitation = item.rain ? item.rain['3h'] : 0;

                    return `
                    <li>
                        <p>Datum: ${new Date(item.dt * 1000).toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}</p>
                        <p>Čas: ${new Date(item.dt * 1000).toLocaleTimeString()}</p>
                        <p>Teplota: ${item.main.temp}°C</p>
                        <p>Počasí: ${item.weather[0].description}</p>
                        <p>Srážky: ${forecastPrecipitation ? forecastPrecipitation.toFixed(1) : '0.0'} mm</p>
                        <p>Rychlost větru: ${forecastWindSpeedKmh} km/h</p>
                        <button onclick="toggleHourlyForecast(${item.dt}, this)">Zobrazit hodinovou předpověď</button>
                        <div id="hourly-${item.dt}" style="display: none;"></div>
                    </li>`;
                }).join('')}
            </ul>
        </div>
        <script id="forecast-data" type="application/json">${JSON.stringify(forecastData)}</script>
    `;
}

function toggleHourlyForecast(dateTime, button) {
    const hourlyDiv = document.getElementById(`hourly-${dateTime}`);
    if (hourlyDiv.style.display === 'none') {
        hourlyDiv.style.display = 'block';
        showHourlyForecast(dateTime);
        button.textContent = 'Schovat hodinovou předpověď';
    } else {
        hourlyDiv.style.display = 'none';
        button.textContent = 'Zobrazit hodinovou předpověď';
    }
}

function showHourlyForecast(dateTime) {
    const hourlyDiv = document.getElementById(`hourly-${dateTime}`);
    const forecastData = JSON.parse(document.getElementById('forecast-data').textContent);

    const hourlyData = forecastData.list.filter(item => {
        const date = new Date(item.dt * 1000);
        return date.getDate() === new Date(dateTime * 1000).getDate();
    });

    hourlyDiv.innerHTML = `
        <div id="hourly-forecast">
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
            <button onclick="toggleHourlyForecast(${dateTime}, this)">Schovat hodinovou předpověď</button>
        </div>
    `;
}

function showSun() {
    const sun = document.createElement('div');
    sun.classList.add('sun');
    document.getElementById('current-weather-visuals').appendChild(sun);
}

function showClouds() {
    const clouds = document.createElement('div');
    clouds.classList.add('cloud');
    clouds.innerHTML = `
        <div class="clouds x1"></div>
        <div class="clouds x2"></div>
        <div class="clouds x3"></div>
        <div class="clouds x4"></div>
        <div class="clouds x5"></div>
    `;
    document.getElementById('current-weather-visuals').appendChild(clouds);
}

function showRain() {
    const rain = document.createElement('div');
    rain.classList.add('rain');
    document.getElementById('current-weather-visuals').appendChild(rain);

    const numberOfDrops = 10; // Adjust the number of drops as needed

    for (let i = 0; i < numberOfDrops; i++) {
        const drop = document.createElement('div');
        drop.className = 'drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random()}s`;
        rain.appendChild(drop);
    }
}