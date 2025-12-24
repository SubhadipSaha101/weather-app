const weatherApiKey="a44d9681153e8735db69d35b22dfcc92";
let useCityTime=true,lastData=null,lastQuery=null;
let soundEnabled=false;

/* SOUNDS */
const sounds={
 rain:rainSound, thunder:thunderSound,
 snow:snowSound, wind:windSound, clear:clearSound
};
function stopAllSounds(){
 Object.values(sounds).forEach(s=>{s.pause();s.currentTime=0});
}
function toggleSound(){
 soundEnabled=!soundEnabled;
 if(!soundEnabled) stopAllSounds();
 else if(lastData) playWeatherSound(lastData.weather[0].id);
}
function playWeatherSound(id){
 if(!soundEnabled) return;
 stopAllSounds();
 if(id<300) sounds.thunder.play();
 else if(id<600) sounds.rain.play();
 else if(id<700) sounds.snow.play();
 else if(id<800) sounds.wind.play();
 else sounds.clear.play();
}

/* AUTH */
function showSignup(){loginBox.classList.add("hidden");signupBox.classList.remove("hidden")}
function showLogin(){signupBox.classList.add("hidden");loginBox.classList.remove("hidden")}
function signup(){auth.createUserWithEmailAndPassword(signupEmail.value,signupPassword.value).catch(e=>alert(e.message))}
function login(){auth.signInWithEmailAndPassword(loginEmail.value,loginPassword.value).catch(e=>alert(e.message))}
function logout(){
 stopAllSounds();
 app.classList.add("hidden");
 authBox.classList.remove("hidden");
 auth.signOut();
}

/* STATE */
auth.onAuthStateChanged(user=>{
 if(user){
  authBox.classList.add("hidden");
  app.classList.remove("hidden");
  userEmail.innerText=user.email;
 }
});

/* WEATHER */
function showLoader(b){loader.classList.toggle("hidden",!b)}
function showError(msg){
 cityName.innerText=msg;
 temperature.innerText=description.innerText=emoji.innerText="";
 retryBtn.classList.remove("hidden");
 timeBox.classList.add("hidden");
 snow.classList.add("hidden"); rain.classList.add("hidden");
}
function retry(){if(lastQuery) fetchWeather(lastQuery)}

function getWeatherByCity(){
 const city=cityInput.value.trim();
 if(!city) return;
 fetchWeather(`q=${city}`); lastQuery=`q=${city}`;
}
function getWeatherByLocation(){
 navigator.geolocation.getCurrentPosition(p=>{
  fetchWeather(`lat=${p.coords.latitude}&lon=${p.coords.longitude}`);
 });
}

function fetchWeather(q){
 showLoader(true); retryBtn.classList.add("hidden");
 fetch(`https://api.openweathermap.org/data/2.5/weather?${q}&appid=${weatherApiKey}&units=metric`)
 .then(r=>{if(!r.ok) throw r; return r.json()})
 .then(d=>{
  lastData=d;
  cityName.innerText=`${d.name}, ${d.sys.country}`;
  temperature.innerText=Math.round(d.main.temp)+"°C";
  description.innerText=d.weather[0].description;
  emoji.innerText=getEmoji(d.weather[0].id);
  applyAnimation(d.weather[0].id);
  timeBox.classList.remove("hidden");
  applyAnimation(d.weather[0].id);
  playWeatherSound(d.weather[0].id);
  updateTimeAndTheme();
  prepareSpeechText();   // 🔊 prepare text for speech

 })
 .catch(()=>{
  if(!navigator.onLine) showError("No internet connection");
  else showError("City not found");
 })
 .finally(()=>showLoader(false))
}

/* ANIMATION */
function applyAnimation(id){
  snow.classList.add("hidden");
  rain.classList.add("hidden");
  document.body.classList.remove("flash");

  const main = lastData.weather[0].main.toLowerCase();
  const desc = lastData.weather[0].description.toLowerCase();
  const clouds = lastData.clouds?.all || 0;
  const humidity = lastData.main.humidity;

  // ❄ Snow
  if(id >= 600 && id <= 622){
    snow.classList.remove("hidden");
  }

  // 🌧 Rain (balanced & accurate)
  else if(
    (id >= 300 && id <= 531) ||            // drizzle + rain
    main === "rain" ||                     // explicit rain
    desc.includes("light rain") ||          // clear rain signal
    desc.includes("moderate rain") ||
    desc.includes("heavy rain")
  ){
    rain.classList.remove("hidden");
  }

  // ⚡ Thunder
  if(id < 300){
    document.body.classList.add("flash");
  }
}


function isRainCondition(d){
  const id = d.weather[0].id;
  const main = d.weather[0].main.toLowerCase();
  const desc = d.weather[0].description.toLowerCase();

  return (
    (id >= 300 && id <= 531) ||   // drizzle + rain
    main === "rain" ||
    desc.includes("light rain") ||
    desc.includes("moderate rain") ||
    desc.includes("heavy rain")
  );
}




/* TIME */
function updateTimeAndTheme(){
  if(!lastData) return;

  let now;

  if(useCityTime === true){
    // CITY TIME
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    now = new Date(utc + lastData.timezone * 1000);
    timeLabel.innerText = "City Time";
  } else {
    // DEVICE TIME
    now = new Date();
    timeLabel.innerText = "Device Time";
  }

  localTime.innerText = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const hour = now.getHours();
  document.body.className = (hour >= 6 && hour < 18) ? "day" : "night";
}

function toggleTimeMode(){
  useCityTime = !useCityTime;   // toggle true/false
  updateTimeAndTheme();        // refresh time immediately
}

setInterval(updateTimeAndTheme,1000);

/* EMOJI */
function getEmoji(id){
  if(id < 300) return "⛈️";
  if(id >= 600 && id <= 622) return "❄️";
  if(isRainCondition(lastData)) return "🌧️";
  if(id === 800) return "☀️";
  return "☁️";
}

/* 🔊 SPEECH (MOBILE SAFE) */
/* 🔊 SPEECH (MOBILE SAFE) */
let speechText = "";

function prepareSpeechText() {
  if (!lastData) return;

  const city = `${lastData.name}, ${lastData.sys.country}`;
  const temp = Math.round(lastData.main.temp);
  const desc = lastData.weather[0].description;

  speechText = `The weather in ${city} is ${desc} with temperature ${temp} degrees Celsius.`;
}

function speakWeather() {
  if (!speechText) {
    alert("Please search weather first");
    return;
  }

  // VERY IMPORTANT FOR MOBILE
  window.speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(speechText);
  msg.lang = "en-US";
  msg.rate = 1;
  msg.pitch = 1;

  window.speechSynthesis.speak(msg);
}




/* OFFLINE */
window.addEventListener("offline",()=>offlineBanner.classList.remove("hidden"));
window.addEventListener("online",()=>offlineBanner.classList.add("hidden"));
