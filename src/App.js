/*
A basic Three.js app reuires 4 main things:
    * Scene - holds all objects, lights, camera etc
    * Objects - geometry
    * Camera - how we see the scene
    * Renderer - how everything is rendered
*/
import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import Stats from 'stats.js';
import SimplexNoise from 'simplex-noise';

export default class App
{
    constructor()
    {
        this.stats = new Stats();

        this.gui = new dat.GUI();

        this.canvas = document.querySelector('.webgl');
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.autoRotate = true;

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer(
            {
                canvas: this.canvas,
                antialias: true
            }
        );
    }

    onStart()
    {
        /*
        event listeners
        */
        window.addEventListener('resize', () => 
        {
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;

            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
        });

        /*
        initial setup
        */
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
        this.camera.position.z = -800;
        this.camera.position.y = -100;
        //rotate camera on X axis
        this.camera.rotation.x = 0.4;
        this.scene.add(this.camera);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.sizes.width, this.sizes.height);

        //create an AudioListener and add it to the camera
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);

        this.noise = new SimplexNoise();
        

        

        this.sphere = new THREE.SphereGeometry( 20, 32, 16 );
        this.plane = new THREE.PlaneGeometry( 1000, 1000, 100, 100 );

        this.material1 = new THREE.MeshPhongMaterial( { color: 0xff1100, flatShading: false, shininess: 0, wireframe: true} );
        this.material1.emissive.setHex(0xff1100);

        this.material2 = new THREE.MeshPhongMaterial( { color: 0x12d4ff, flatShading: false, shininess: 0, wireframe: true} );
        this.material2.emissive.setHex(0x12d4ff);

        // sound spheres
        this.mesh1 = new THREE.Mesh( this.sphere, this.material1 );
        this.mesh1.position.set( 0, 10, -1000 );
        this.scene.add( this.mesh1 );

        this.mesh2 = new THREE.Mesh( this.plane, this.material2 );
        this.mesh2.position.set( 0, -100, -1000 );
        //rotate the plane around the x axis
        this.mesh2.rotateX(90);
        this.scene.add( this.mesh2 );

        this.mesh3 = new THREE.Mesh( this.plane, this.material2 );
        this.mesh3.position.set( 0, 100, -1000 );
        //rotate the plane around the x axis
        this.mesh3.rotateX(90);
        this.scene.add( this.mesh3 );

        //add a point light with a white color
        const light = new THREE.PointLight( 0xffffff, 1000, 100);
        light.position.set(0, 0, -80);
        this.scene.add(light);
        
        this.multiplier = {noiseValue:0,multi:10,sphereMulti:1};
        this.gui.add(this.multiplier, 'multi', 0, 20).onChange(() => {
            this.multi = this.multiplier.multi;
        }).name('Amplitude Multiplier');

        this.gui.add(this.multiplier, 'sphereMulti', 1, 10).onChange(() => {
            this.sphereMulti = this.multiplier.sphereMulti;
        }).name('Sphere Multiplier');

        this.sphereColor = {color:0xff1100};
        this.gui.addColor(this.sphereColor, 'color').onChange(() => {
            this.mesh1.material.color.setHex(this.sphereColor.color);
            this.mesh1.material.emissive.setHex(this.sphereColor.color);
        }).name('Sphere Color');

        this.planeColor = {color:0x12d4ff};
        this.gui.addColor(this.planeColor, 'color').onChange(() => {
            this.mesh2.material.color.setHex(this.planeColor.color);
            this.mesh2.material.emissive.setHex(this.planeColor.color);
        }).name('Plane Color');
        
        //make plane rough
        for (let index = 0; index < this.mesh2.geometry.attributes.position.array.length -3; index += 3) {
            //every 3 values in the array is a vertex
            let x = this.mesh2.geometry.attributes.position.array[index];
            let y = this.mesh2.geometry.attributes.position.array[index + 1];
            let noiseValue = this.noise.noise2D(x, y);
            this.mesh2.geometry.attributes.position.array[index + 2] = noiseValue * this.multiplier.noiseValue;
            this.mesh3.geometry.attributes.position.array[index + 2] = noiseValue * this.multiplier.noiseValue;
        }

        
    }

    loadAudio()
    {
        let context = new AudioContext();
        let src = context.createMediaElementSource(audio);
        this.analyser = context.createAnalyser();
        src.connect(this.analyser);
        this.analyser.connect(context.destination);
        this.analyser.fftSize = 512;
        let bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        this.audioLoaded = true;
    }

    onUpdate(dt)
    {   
        //needs to come at the beginning of onUpdate
        this.stats.begin();       
        
        

        //rotate the sphere around its Y axis
        this.sphere.rotateY(0.001);
        //rotate the sphere around its X axis
        this.sphere.rotateX(0.001);
        //rotate the sphere around its Z axis
        this.sphere.rotateZ(0.001);

        //orbit the camera around mesh1
        this.camera.lookAt(this.mesh1.position);
        
        

        //if the audio is loaded, update the dataArray
        if(this.audioLoaded)
        {

            this.analyser.getByteFrequencyData(this.dataArray);

            let lowerHalfArray = this.dataArray.slice(0, (this.dataArray.length/2) - 1);
            let upperHalfArray = this.dataArray.slice((this.dataArray.length/2) - 1, this.dataArray.length - 1);
            //console.log(this.dataArray);
            //console.log(upperHalfArray);

            let overallAvg = avg(this.dataArray);
            let lowerMax = max(lowerHalfArray);
            let lowerAvg = avg(lowerHalfArray);
            let upperMax = max(upperHalfArray);
            let upperAvg = avg(upperHalfArray);

            let lowerMaxFr = lowerMax / lowerHalfArray.length;
            let lowerAvgFr = lowerAvg / lowerHalfArray.length;
            let upperMaxFr = upperMax / upperHalfArray.length;
            this.upperAvgFr = upperAvg / upperHalfArray.length;

            // // //change the radius of the sphere based on the frequency of the sound
            // //let newScale = this.analyser.getAverageFrequency()/50;
            this.mesh1.scale.set(lowerAvgFr*this.multiplier.sphereMulti, lowerAvgFr*this.multiplier.sphereMulti, lowerAvgFr*this.multiplier.sphereMulti);
            this.multiplier.noiseValue = lowerAvgFr * this.multiplier.multi;
            
            // TODO: change the color of the sphere based on the frequency of the sound
            // let newColor = overallAvg;
            // console.log(newColor);
            // this.mesh1.material.color.setHex(newColor);
            // this.mesh1.material.emissive.setHex(newColor);
            // this.mesh1.material.needsUpdate = true;
            
            
        }

    }

    onRender()
    {
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
        //make plane rough
        for (let index = 0; index < this.mesh2.geometry.attributes.position.array.length -1; index += 3) {
            //every 3 values in the array is a vertex
            let x = this.mesh2.geometry.attributes.position.array[index];
            let y = this.mesh2.geometry.attributes.position.array[index + 1];
            let time = Date.now();
            let distance = (this.noise.noise2D(x+time * 0.0003, y+time * 0.0001) + 0) * modulate(this.upperAvgFr, 0, 1, 0.5, 4) * this.multiplier.noiseValue;
            let noiseValue = this.noise.noise2D(x, y);
            this.mesh2.geometry.attributes.position.array[index + 2] = distance; //noiseValue * this.multiplier.noiseValue;
            this.mesh3.geometry.attributes.position.array[index + 2] = distance; //noiseValue * this.multiplier.noiseValue;
            //update the position of the vertex
            this.mesh2.geometry.attributes.position.needsUpdate = true;
            
        }

        
        
        

        //needs to come at the end of onRender
        this.stats.end();
    }
    
}

//some helper functions here
function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    let fr = fractionate(val, minVal, maxVal);
    let delta = outMax - outMin;
    return outMin + (fr * delta);
}

//find average value of an array
function avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

//find maximum value of an array
function max(arr) 
{
    return Math.max(...arr);
}
