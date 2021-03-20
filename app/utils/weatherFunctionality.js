"use strict";
const axios = require("axios");

const WeatherFunctionality = {
  getWeatherDetails: async function (monument) {
    try {
      const apiWeatherRequest = await axios.get(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${monument.coordinates.latitude}&lon=${monument.coordinates.longitude}&units=metric&exclude=minutely,alerts&appid=${process.env.openweather_api_key}`
      );

      if (apiWeatherRequest.status == 200) {
        return apiWeatherRequest.data;
      } else {
        return undefined;
      }
    } catch (err) {
      return undefined;
    }
  },
  manipulateApiResponse: function (weatherApiResponse) {
    let weatherData,
      currentWeather,
      dailyWeather,
      formattedSunsetTime,
      currentWeatherFormattedObject,
      currentWeatherDescription,
      weatherAvailable;
    let weatherForecastNextWeek = [];

    if (typeof weatherApiResponse !== "undefined") {
      weatherAvailable = true;
      weatherData = weatherApiResponse;
      currentWeather = weatherData.current;
      currentWeatherDescription = currentWeather.weather[0].main;
      dailyWeather = weatherData.daily;

      const fullDateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      const timeOptions = { hour: "numeric", minute: "numeric", second: "numeric" };

      let sunsetDateObject = new Date(currentWeather.sunset * 1000);

      formattedSunsetTime = sunsetDateObject.toLocaleString("en-IE", timeOptions);

      for (let dailyForecast in dailyWeather) {
        let dateObject = new Date(dailyWeather[dailyForecast].dt * 1000);

        let dailyWeatherSummary = dailyWeather[dailyForecast].weather;

        let formattedDate = dateObject.toLocaleString("en-IE", fullDateOptions);

        let dayWeatherObject = {
          Date: formattedDate,
          Summary: dailyWeatherSummary[0]["main"],
          Description: dailyWeatherSummary[0]["description"],
        };

        weatherForecastNextWeek.push(dayWeatherObject);
      }

      currentWeatherFormattedObject = {
        "Perceived Temperature": currentWeather["feels_like"],
        Pressure: currentWeather["pressure"],
        Humidity: currentWeather["humidity"],
        "Wind Speed": currentWeather["wind_speed"],
      };
    } else {
      weatherAvailable = false;
      currentWeather = undefined;
      currentWeatherFormattedObject = undefined;
      weatherForecastNextWeek = undefined;
      formattedSunsetTime = undefined;
      currentWeatherDescription = undefined;
    }

    return {
      weatherAvailable: weatherAvailable,
      currentWeather: currentWeather,
      currentWeatherFormattedObject: currentWeatherFormattedObject,
      weatherForecastNextWeek: weatherForecastNextWeek,
      formattedSunsetTime: formattedSunsetTime,
      currentWeatherDescription: currentWeatherDescription,
    };
  },
};

module.exports = WeatherFunctionality;
