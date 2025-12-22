const weatherApiKey = "a44d9681153e8735db69d35b22dfcc92";

let useCityTime = true;
let lastData = null;

/* Auth UI */
function showSignup(){ loginBox.classList.add("hidden"); signupBox.classList.remove("hidden"); }
function showLogin(){ signupBox.classList.add("hidden"); loginBox.classList.remove("hidden"); }

/* Signup / Login */
function signup(){
  auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
    .catch(e=>alert(e.message));
}
function login(){
  auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
    .catch(e=>alert(e.message));
}

/* Logout with animation */
function logout(){
  app.classList.add("fade-out");
  setTimeout(()=>{
    localStorage.removeItem("lastCity");
    lastData=null;
    cityName.innerText=temperature.innerText=description.innerText=emoji.innerText=localTime.innerText="";
    cityInput.value="";
    app.classList.add("hidden");
    app.classList.remove("fade-out");
    authBox.classList.remove("hidden");
    authBox.classList.add("fade-in");
    document.body.className="day";
    auth.signOut();
  },500);
}

/* Auth state */
auth.onAuthStateChanged(user=>{
  if(user){
    authBox.classList.add("hidden");
    app.classList.remove("hidden");
    userEmail.innerText=user.email;
    const saved=localStorage.getItem("lastCity");
    if(saved) fetchWeather(`q=${saved}`);
  }
});

/* Weather */
function getWeatherByCity(){
  const city=cityInput.value.trim(); if(!city) return;
  localStorage.setItem("lastCity",city);
  fetchWeather(`q=${city}`);
}
function getWeatherByLocation(){
  navigator.geolocation.getCurrentPosition(p=>{
    fetchWeather(`lat=${p.coords.latitude}&lon=${p.coords.longitude}`);
  });
}
function fetchWeather(q){
  fetch(`https://api.openweathermap.org/data/2.5/weather?${q}&appid=${weatherApiKey}&units=metric`)
    .then(r=>r.json()).then(d=>{
      lastData=d;
      cityName.innerText=`${d.name}, ${d.sys.country}`;
      temperature.innerText=Math.round(d.main.temp)+"°C";
      description.innerText=d.weather[0].description;
      emoji.innerText=getEmoji(d.weather[0].id);
      updateTimeAndTheme();
    });
}

/* Time (correct city time) */
function updateTimeAndTheme(){
  if(!lastData) return;
  let now;
  if(useCityTime){
    const utc = Date.now() + new Date().getTimezoneOffset()*60000;
    now = new Date(utc + lastData.timezone*1000);
    timeLabel.innerText="City Time";
  }else{
    now=new Date(); timeLabel.innerText="Device Time";
  }
  // 12-hour with AM/PM (change to en-GB + hour12:false for 24h)
  localTime.innerText = now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true});
  document.body.className = (now.getHours()>=6 && now.getHours()<18)?"day":"night";
}
function toggleTimeMode(){ useCityTime=!useCityTime; updateTimeAndTheme(); }
setInterval(updateTimeAndTheme,1000);

/* Emoji */
function getEmoji(id){
  if(id<300) return "⛈️";
  if(300<=id<=321) return "🌥️";
  if(500<=id<=531) return "🌧️";
  if(600<=id<=622) return "❄️";
  if(701<=id<=741) return "🌫️";
  if(id==762) return "🌋";
  if(id==771) return "💨";
  if(id==781) return "🌪️";
  if(id==800) return "☀️";
  if(801<=id<=804) return "☁️";
  else return "";
}