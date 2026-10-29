/**
 * Clasificador meteorológico: traduce variables físicas (Temperatura, Humedad, Presión, Viento)
 * a condiciones comprensibles para cualquier usuario (Soleado, Lluvia, Tormenta, etc.).
 */

export function classifyWeather({ temp, humidity = 60, pressure = 1012, windSpeed = 5 }) {
  // Conversión de viento m/s a km/h
  const windKmh = Math.round(windSpeed * 3.6);

  // Probabilidad de lluvia basada en humedad y presión
  // Humedad alta + presión baja = alta probabilidad de lluvia
  let rainProb = 5;
  if (humidity > 70) {
    rainProb = Math.min(95, Math.round(20 + (humidity - 70) * 2.5 + Math.max(0, 1013 - pressure) * 4));
  } else if (humidity > 55) {
    rainProb = Math.round(10 + (humidity - 55) * 0.8);
  }

  // Sensación térmica aproximada (Heat Index simplificado)
  let feelLike = temp;
  if (temp >= 26 && humidity >= 40) {
    feelLike = Math.round(temp + ((humidity - 40) / 100) * 4.5);
  } else if (temp <= 18 && windKmh >= 15) {
    feelLike = Math.round(temp - (windKmh / 20) * 2);
  }

  // Clasificación de la condición
  let condition = 'partly_cloudy';
  let title = 'Clima Templado';
  let summary = 'Condiciones agradables y cielo con intervalos de nubes.';
  let advice = 'Un día ideal para actividades al aire libre.';
  let color = 'amber';

  if (rainProb >= 75 && pressure < 1008 && windKmh >= 25) {
    condition = 'storm';
    title = 'Alerta de Tormenta';
    summary = `Fuertes ráfagas de viento (${windKmh} km/h) combinadas con alta humedad (${humidity.toFixed(0)}%) y caída de presión barométrica.`;
    advice = 'Busca resguardo bajo techo. Posible actividad eléctrica.';
    color = 'rose';
  } else if (rainProb >= 70) {
    condition = 'rain';
    title = 'Lluvias / Chubascos';
    summary = `El aire caliente chocó con humedad saturada (${humidity.toFixed(0)}%). La condensación provocará lluvias en la zona.`;
    advice = 'Sal con paraguas o impermeable si vas a salir.';
    color = 'sky';
  } else if (temp >= 32) {
    condition = 'sunny';
    title = 'Tarde Muy Calurosa';
    summary = `Domo de calor activo con ${temp.toFixed(1)} °C. Baja humedad y presión estable impiden la formación de nubes de lluvia.`;
    advice = 'Usa protector solar, ropa fresca y mantén buena hidratación.';
    color = 'orange';
  } else if (temp >= 26) {
    condition = 'sunny';
    title = 'Soleado y Cálido';
    summary = `Ambiente despejado con buena radiación solar y brisa de ${windKmh} km/h.`;
    advice = 'Buen tiempo para pasear o hacer deporte.';
    color = 'amber';
  } else if (windKmh >= 30) {
    condition = 'windy';
    title = 'Ventoso con Ráfagas';
    summary = `Corrientes de viento aceleradas cruzando el valle a ${windKmh} km/h.`;
    advice = 'Asegura objetos ligeros en balcones o terrazas.';
    color = 'cyan';
  } else if (temp <= 16) {
    condition = 'cold';
    title = 'Ambiente Frío';
    summary = `Masa de aire frío asentada sobre la región (${temp.toFixed(1)} °C).`;
    advice = 'Usa un abrigo o chaqueta liviana al salir.';
    color = 'indigo';
  }

  return {
    condition,
    title,
    summary,
    advice,
    color,
    rainProb,
    feelLike,
    windKmh,
    humidity: Math.round(humidity),
    pressure: Math.round(pressure),
  };
}
