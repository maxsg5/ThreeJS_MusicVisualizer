import App from "./App";
let fileLabel = document.querySelector('label.file');
let file = document.getElementById("thefile");
let audio = document.getElementById("audio");
const app = new App();
app.audioLoaded = false;


file.onchange = function(){
    fileLabel.classList.add('normal');
    audio.classList.add('active');
    let files = this.files;
    
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    app.loadAudio();
    
}
app.onStart();
/*
Main Animation Loop
*/
let time = (new Date() * 0.001);
function animate()
{
    const currentTime = (new Date()) * 0.001;
    const deltaTime = currentTime - time;
    time = currentTime;

    app.onUpdate(deltaTime);
    app.onRender();
    requestAnimationFrame(animate);
}
animate();
