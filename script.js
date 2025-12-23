const weatherApiKey="a44d9681153e8735db69d35b22dfcc92";
let useCityTime=true,lastData=null;

/* Auth UI */
function showSignup(){loginBox.classList.add("hidden");signupBox.classList.remove("hidden")}
function showLogin(){signupBox.classList.add("hidden");loginBox.classList.remove("hidden")}

/* Auth */
function signup(){auth.createUserWithEmailAndPassword(signupEmail.value,signupPassword.value).catch(e=>alert(e.message))}
function login(){auth.signInWithEmailAndPassword(loginEmail.value,loginPassword.value).catch(e=>alert(e.message))}
function logout(){auth.signOut()}

/* Auth state */
auth.onAuthStateChanged(u=>{
 if(u){
  authBox.classList.add("hidden");
  app.classList.remove("hidden");
  userEmail.innerText=u.email;
 }else{
  app.classList.add("hidden");
  authBox.classList.remove("hidden");
 }
})

/* Weather */
function getWeatherByCity(){
 const c=cityInput.value.trim();if(!c)return;
 localStorage.setItem("lastCity",c);
 fetchWeather(`q=${c}`);
}
function getWeatherByLocation(){
 navigator.geolocation.getCurrentPosition(
  p=>fetchWeather(`lat=${p.coords.latitude}&lon=${p.coords.longitude}`),
  ()=>showError("Location denied 📍")
 )
}

function fetchWeather(q){
 if(!navigator.onLine){offlineBanner.classList.remove("hidden");showError("No internet 🌐");return}
 offlineBanner.classList.add("hidden");
 loader.classList.remove("hidden");

 fetch(`https://api.openweathermap.org/data/2.5/weather?${q}&appid=${weatherApiKey}&units=metric`)
 .then(r=>{if(!r.ok)throw new Error("City not found ❌");return r.json()})
 .then(d=>{
  lastData=d;
  cityName.innerText=`${d.name}, ${d.sys.country}`;
  temperature.innerText=Math.round(d.main.temp)+"°C";
  description.innerText=d.weather[0].description;
  emoji.innerText=getEmoji(d.weather[0].id);
  retryBtn.classList.add("hidden");
  updateTime();
  updateEffects(d.weather[0].id);
 })
 .catch(e=>showError(e.message))
 .finally(()=>loader.classList.add("hidden"))
}

function showError(msg){
 lastData=null;
 cityName.innerText="Error";
 temperature.innerText="--";
 description.innerText=msg;
 emoji.innerText="⚠️";
 localTime.innerText="";
 timeLabel.innerText="";
 retryBtn.classList.remove("hidden");
}

function retryWeather(){
 const c=localStorage.getItem("lastCity");
 if(c)fetchWeather(`q=${c}`);
}

/* Time */
function updateTime(){
 if(!lastData)return;
 let now;
 if(useCityTime){
  const utc=Date.now()+new Date().getTimezoneOffset()*60000;
  now=new Date(utc+lastData.timezone*1000);
  timeLabel.innerText="City Time";
 }else{
  now=new Date();
  timeLabel.innerText="Device Time";
 }
 localTime.innerText=now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true});
 document.body.className=(now.getHours()>=6&&now.getHours()<18)?"day":"night";
}
function toggleTimeMode(){if(!lastData)return;useCityTime=!useCityTime;updateTime()}
setInterval(updateTime,1000);

/* Effects */
function updateEffects(id){
 rain.classList.add("hidden");snow.classList.add("hidden");clouds.classList.add("hidden");stars.classList.add("hidden");
 rainSound.pause();thunderSound.pause();

 if(id>=200&&id<=232){document.body.classList.add("flash");setTimeout(()=>document.body.classList.remove("flash"),200);thunderSound.play()}
 if(id>=500&&id<=531){rain.classList.remove("hidden");rainSound.play()}
 if(id>=600&&id<=622)snow.classList.remove("hidden");
 if(id>=801&&id<=804)clouds.classList.remove("hidden");
 if(document.body.className==="night")stars.classList.remove("hidden");
}

/* Emoji */
function getEmoji(id){
 if(id>=200&&id<=232)return"⛈️";
 if(id>=300&&id<=321)return"🌥️";
 if(id>=500&&id<=531)return"🌧️";
 if(id>=600&&id<=622)return"❄️";
 if(id>=701&&id<=741)return"🌫️";
 if(id===800)return"☀️";
 if(id>=801)return"☁️";
 return"";
}

/* PWA */
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{
 e.preventDefault();
 deferredPrompt=e;
 installBtn.classList.remove("hidden");
});
installBtn.onclick=()=>deferredPrompt.prompt();
