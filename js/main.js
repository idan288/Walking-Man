// Constants:
const Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    black: 0x000000
};

// Global vars:
// init
let scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
    renderer, container, onJump, onBend;
onJump = false;
onBend = false;

window.addEventListener('load', init);

function init() {
    // set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLights();

    //add the objects
    // createPlane();

    createSky();
    createSea();
    createMan();
    createHero();
    //add the listener
    document.addEventListener('mousemove', handleMouseMove, false);

    // start a loop that will update the objects' positions
    // and render the scene on each frame
    loop();
}

function createScene() {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer.
    HEIGHT = window.innerHeight * 0.6;
    WIDTH = window.innerWidth * 0.6;

    // Create the scene
    scene = new THREE.Scene();

    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // Create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // Set the position of the camera
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;

    // Create the renderer
    renderer = new THREE.WebGLRenderer({
        // Allow transparency to show the gradient backgroun
        // we defined in the CSS
        alpha: true,

        // Activate the anti-aliasing; this is less performant,
        // but, as our project is low-poly based, it should be fine :)
        antialias: true
    });

    // Define the size of the renderer; in this case,
    // it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    // Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Add the DOM element of the renderer to the
    // container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // Listen to the screen: if the user resize it
    // we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
    handleWindowResize();
}

function handleWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

//Lights vars:
let hemisphereLight, shadowLight;

function createLights() {
    // A hemisphere light is a gradient colored light;
    // the first parameter is the sky color, the second parameter is the ground color,
    // the third parameter is the intensity of the light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

    // an ambient light modifies the global color of a scene and makes the shadows softer
    let ambientLight = new THREE.AmbientLight(0xdc8874, .5);
    scene.add(ambientLight);

    // A directional light shines from a specific direction.
    // It acts like the sun, that means that all the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);
    // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

    // Allow shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less performance
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

class Sea {
    constructor() {
        // create the geometry (shape) of the cylinder;
        // the parameters are:
        // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
        this.geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
        // rotate the geometry on the x axis
        this.geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

        // important: by merging vertices we ensure the continuity of the waves
        this.geom.mergeVertices();
        // get the vertices
        let l = this.geom.vertices.length;
        // create an array to store new data associated to each vertex
        this.waves = [];
        for (let i = 0; i < l; i++) {
            // get each vertex
            let v = this.geom.vertices[i];

            // store some data associated to it
            this.waves.push({
                y: v.y,
                x: v.x,
                z: v.z,
                // a random angle
                ang: Math.random() * Math.PI * 2,
                // a random distance
                amp: 5 + Math.random() * 15,
                // a random speed between 0.016 and 0.048 radians / frame
                speed: 0.016 + Math.random() * 0.032
            });
            // create the material
            this.mat = new THREE.MeshPhongMaterial({
                color: Colors.blue,
                transparent: true,
                opacity: .8,
                flatShading: true
            });

            // To create an object in Three.js, we have to create a mesh
            // which is a combination of a geometry and some material
            this.mesh = new THREE.Mesh(this.geom, this.mat);

            // Allow the sea to receive shadows
            this.mesh.receiveShadow = true;
        }

    }

    moveWaves() {
        // get the vertices
        let verts = this.mesh.geometry.vertices;
        let l = verts.length;

        for (let i = 0; i < l; i++) {
            let v = verts[i];

            // get the data associated to it
            let vprops = this.waves[i];

            // update the position of the vertex
            v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
            v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

            // increment the angle for the next frame
            vprops.ang += vprops.speed;
        }
        // Tell the renderer that the geometry of the sea has changed.
        // In fact, in order to maintain the best level of performance,
        // three.js caches the geometries and ignores any changes
        // unless we add this line
        this.mesh.geometry.verticesNeedUpdate = true;
    }
}

let sea;

function createSea() {
    sea = new Sea();
    // push it a little bit at the bottom of the scene
    sea.mesh.position.y = -600;
    // add the mesh of the sea to the scene
    scene.add(sea.mesh);
}

let man;
let newman; // just to get the orignal cordinate before move.

function createMan() {
    man = new Man();
    newman = new Man();
    callBackMAp.set('man', man);
    //man.threeGroup.position.set(0, 0, 0);
    // man.threeGroup.scale.set(1.5, 1.5, 1.5);

    man.threeGroup.rotation.y = -.3;
    man.threeGroup.position.y += 15;

    console.log(man.threeGroup);
    console.log(man.head);
    //man.threeGroup.scale.set(2, 2, 2);
    scene.add(man.threeGroup);
}

class Cloud {
    constructor() {
        // Create an empty container that will hold the different parts of the cloud
        this.mesh = new THREE.Object3D();

        // create a cube geometry;
        // this shape will be duplicated to create the cloud
        this.geom = new THREE.BoxGeometry(20, 20, 20);

        // create a material; a simple white material will do the trick
        this.mat = new THREE.MeshPhongMaterial({
            color: Colors.white
        });

        // duplicate the geometry a random number of times
        let cloudPartAmount = 3 + Math.floor(Math.random() * 3);
        let cloudPart;
        let sizeCloudPart;
        for (let i = 0; i < cloudPartAmount; i++) {

            // create the mesh by cloning the geometry
            cloudPart = new THREE.Mesh(this.geom, this.mat);

            // set the position and the rotation of each cube randomly
            cloudPart.position.x = i * 15;
            cloudPart.position.y = Math.random() * 10;
            cloudPart.position.z = Math.random() * 10;
            cloudPart.rotation.z = Math.random() * Math.PI * 2;
            cloudPart.rotation.y = Math.random() * Math.PI * 2;

            // set the size of the cube randomly
            sizeCloudPart = .1 + Math.random() * .9;
            cloudPart.scale.set(sizeCloudPart, sizeCloudPart, sizeCloudPart);

            // allow each cube to cast and to receive shadows
            cloudPart.castShadow = true;
            cloudPart.receiveShadow = true;

            // add the cube to the container we first created
            this.mesh.add(cloudPart);
        }
    }
}

class Sky {
    constructor(cloudsNumber) {
        // Create an empty container
        this.mesh = new THREE.Object3D();

        // choose a number of clouds to be scattered in the sky
        this.nClouds = cloudsNumber;

        // To distribute the clouds consistently,
        // we need to place them according to a uniform angle
        this.stepAngle = Math.PI * 2 / this.nClouds;

        // create clouds.
        let cloud;
        let angleCloud;
        let heightCloud;
        let scaleCloud;
        for (let i = 0; i < this.nClouds; i++) {
            cloud = new Cloud();

            // set the rotation and the position of each cloud;
            // for that we use a bit of trigonometry
            angleCloud = this.stepAngle * i; // this is the final angle of the cloud
            heightCloud = 750 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

            // Trigonometry!!! I hope you remember what you've learned in Math :)
            // in case you don't:
            // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
            cloud.mesh.position.y = Math.sin(angleCloud) * heightCloud;
            cloud.mesh.position.x = Math.cos(angleCloud) * heightCloud;

            // rotate the cloud according to its position
            cloud.mesh.rotation.z = angleCloud + Math.PI / 2;

            // for a better result, we position the clouds
            // at random depths inside of the scene
            cloud.mesh.position.z = -400 - Math.random() * 400;

            // we also set a random scale for each cloud
            scaleCloud = 1 + Math.random() * 2;
            cloud.mesh.scale.set(scaleCloud, scaleCloud, scaleCloud);

            // do not forget to add the mesh of each cloud in the scene
            this.mesh.add(cloud.mesh);
        }
    }
}

let sky;

function createSky() {
    sky = new Sky(20);
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}


class AirPlane {
    constructor() {
        this.mesh = new THREE.Object3D();

        // Create the cabin
        let geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
        let matCockpit = new THREE.MeshPhongMaterial({
            color: Colors.red,
            flatShading: true
        });

        // we can access a specific vertex of a shape through
        // the vertices array, and then move its x, y and z property:
        geomCockpit.vertices[4].y -= 10;
        geomCockpit.vertices[4].z += 20;
        geomCockpit.vertices[5].y -= 10;
        geomCockpit.vertices[5].z -= 20;
        geomCockpit.vertices[6].y += 30;
        geomCockpit.vertices[6].z += 20;
        geomCockpit.vertices[7].y += 30;
        geomCockpit.vertices[7].z -= 20;

        this.cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        this.cockpit.castShadow = true;
        this.cockpit.receiveShadow = true;
        this.mesh.add(this.cockpit);

        // Create the engine
        let geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
        let matEngine = new THREE.MeshPhongMaterial({
            color: Colors.white,
            flatShading: true
        });
        this.engine = new THREE.Mesh(geomEngine, matEngine);
        this.engine.position.x = 40;
        this.engine.castShadow = true;
        this.engine.receiveShadow = true;
        this.mesh.add(this.engine);

        // Create the tail
        let geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        let matTailPlane = new THREE.MeshPhongMaterial({
            color: Colors.red,
            flatShading: true
        });
        this.tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        this.tailPlane.position.set(-35, 25, 0);
        this.tailPlane.castShadow = true;
        this.tailPlane.receiveShadow = true;
        this.mesh.add(this.tailPlane);

        // Create the wing
        let geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
        let matSideWing = new THREE.MeshPhongMaterial({
            color: Colors.red,
            flatShading: true
        });
        this.sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        this.sideWing.castShadow = true;
        this.sideWing.receiveShadow = true;
        this.mesh.add(this.sideWing);

        // propeller
        let geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
        let matPropeller = new THREE.MeshPhongMaterial({
            color: Colors.brown,
            flatShading: true
        });
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;

        // blades
        let geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
        let matBlade = new THREE.MeshPhongMaterial({
            color: Colors.brownDark,
            flatShading: true
        });

        this.blade = new THREE.Mesh(geomBlade, matBlade);
        this.blade.position.set(8, 0, 0);
        this.blade.castShadow = true;
        this.blade.receiveShadow = true;
        this.propeller.add(this.blade);
        this.propeller.position.set(50, 0, 0);
        this.mesh.add(this.propeller);

        this.pilot = new Pilot();
        this.pilot.mesh.position.set(-10, 27, 0);
        this.mesh.add(this.pilot.mesh);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
}

let airPlane;

function createPlane() {
    airPlane = new AirPlane();
    airPlane.mesh.scale.set(.35, .35, .35);
    airPlane.mesh.position.y = 100;
    scene.add(airPlane.mesh);
}

//let rot = -1;
let callBackMAp = new Map();
let realMap = new Map();

function loop() {
    // Rotate the propeller, the sea and the sky
    sea.moveWaves();
    sea.mesh.rotation.z += .005;
    sky.mesh.rotation.z += .01;
    if (idle === true)
        man.idle();
    // man.mesh.rotation.y += .01;
    // update the plane on each frame
    // updatePlane();
    //man.threeGroup.rotation.y += 0.01;

    realMap.forEach(value => value.Run());
    //  rot += .01;
    // man.threeGroup.rotation.y = -Math.PI / 4 + Math.sin(rot * Math.PI / 8);

    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
}

let mousePos = {
    x: 0,
    y: 0
};

// now handle the mousemove event

function handleMouseMove(event) {
    // here we are converting the mouse position value received
    // to a normalized value varying between -1 and 1;
    // this is the formula for the horizontal axis:

    let tx = -1 + (event.clientX / WIDTH) * 2;

    // for the vertical axis, we need to inverse the formula
    // because the 2D y-axis goes the opposite direction of the 3D y-axis

    let ty = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {
        x: tx,
        y: ty
    };
}

// function updatePlane() {
//     let's move the airplane between -100 and 100 on the horizontal axis,
//     and between 25 and 175 on the vertical axis,
//     depending on the mouse position which ranges between -1 and 1 on both axes;
//     to achieve that we use a normalize function (see below)

//     let targetX = normalize(mousePos.x, -1, 1, -100, 100);
//     let targetY = normalize(mousePos.y, -1, 1, 25, 175);

//     Move the plane at each frame by adding a fraction of the remaining distance
//     airPlane.mesh.position.y += (targetY - airPlane.mesh.position.y) * 0.1;

//     Rotate the plane proportionally to the remaining distance
//     airPlane.mesh.rotation.z = (targetY - airPlane.mesh.position.y) * 0.0128;
//     airPlane.mesh.rotation.x = (airPlane.mesh.position.y - targetY) * 0.0064;

//     update the airplane's position
//     airPlane.pilot.updateHairs();
//     airPlane.propeller.rotation.x += 0.3;
// }

function normalize(v, vmin, vmax, tmin, tmax) {
    let nv = Math.max(Math.min(v, vmax), vmin);
    let dv = vmax - vmin;
    let pc = (nv - vmin) / dv;
    let dt = tmax - tmin;
    return tmin + (pc * dt);
}

const PI = Math.PI;

let yellowMat = new THREE.MeshLambertMaterial({
    color: 0xfdd276,
    flatShading: true
});

let pinkMat = new THREE.MeshLambertMaterial({
    color: 0xe0877e, //0xe0a79f,
    flatShading: true
});

let redMat = new THREE.MeshLambertMaterial({
    color: 0x630d15,
    flatShading: true
});

let whiteMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    flatShading: true
});

let blackMat = new THREE.MeshLambertMaterial({
    color: 0x111111,
    flatShading: true
});
let brownMat = new THREE.MeshLambertMaterial({
    color: 0x2e2019, //0x4b342a,
    flatShading: true
});

let lightBrownMat = new THREE.MeshLambertMaterial({
    color: 0x664f4a,
    flatShading: true
});

let blueMat = new THREE.MeshPhongMaterial({
    color: 0x5b9696,
    flatShading: true
});

let noShadowMeshes = new Map();

class Man {
    constructor() {
        this.threeGroup = new THREE.Group();
        this.runningCycle = 0;
        this.time = 0;
        this.idelingPos = new THREE.Vector3(0, Math.PI / 2, 0);
        this.isBlinking = false;
        this.isIdeling = false;

        // body
        this.body = new THREE.Group();
        // head
        this.head = new THREE.Group();
        let faceGeom = new THREE.BoxGeometry(30, 30, 30);
        this.face = new THREE.Mesh(faceGeom, brownMat);

        // Eyes
        let eyeGeom = new THREE.BoxGeometry(12, 12, 1);
        this.rightEye = new THREE.Mesh(eyeGeom, whiteMat);
        this.rightEye.position.set(7, 6, 15);
        // this.rightEye.rotation.y = -Math.PI / 4;

        this.leftEye = this.rightEye.clone();
        this.leftEye.position.x = -this.rightEye.position.x;
        // this.leftEye.rotation.y = Math.PI / 4;

        // Iris
        let irisGeom = new THREE.BoxGeometry(4, 4, 0.1);
        this.rightIris = new THREE.Mesh(irisGeom, blackMat);
        this.rightIris.position.x = 2;
        this.rightIris.position.y = -2;
        this.rightIris.position.z = .5;
        this.rightIris.name = "rightIris";
        noShadowMeshes.set(this.rightIris.id, this.rightIris);

        this.leftIris = this.rightIris.clone();
        this.leftIris.position.x = -this.rightIris.position.x;
        this.leftIris.name = "leftIris";
        noShadowMeshes.set(this.leftIris.id, this.leftIris);

        this.rightEye.add(this.rightIris);
        this.leftEye.add(this.leftIris);

        // mouth
        let mouthGeo = new THREE.BoxGeometry(15, 6, 1);
        this.mouth = new THREE.Mesh(mouthGeo, whiteMat);
        this.mouth.position.set(1, -6, 15);

        //lips
        let lipsGeo = new THREE.TorusGeometry(3, 0.5, 2, 10, -Math.PI);
        this.lips = new THREE.Mesh(lipsGeo, blackMat);
        this.lips.position.set(1, -5, 15.6);
        this.lips.name = "lips";
        noShadowMeshes.set(this.lips.id, this.lips);

        this.head.add(this.mouth);
        this.head.add(this.lips);
        this.head.add(this.face);
        this.head.add(this.rightEye);
        this.head.add(this.leftEye);
        this.head.position.y = 60;
        this.head.rotation.y = Math.PI / 2;
        this.savedPos = this.head.position;
        this.saveRot = Math.PI / 2;
        this.body.add(this.head);

        /* how to add border to mesh.
        var geo = new THREE.EdgesGeometry(this.face.geometry);
        var mat = new THREE.LineBasicMaterial({
            color: 0xffffff,
        });
        var wireframe = new THREE.LineSegments(geo, mat);
        wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
        this.head.add(wireframe);
        */
        //hands

        let handGeom = new THREE.CubeGeometry(5, 5, 5, 1);
        this.handR = new THREE.Mesh(handGeom, brownMat);
        this.handR.position.z = 17;
        this.handR.position.y = 30;
        //this.handR.position.x = -74;
        this.body.add(this.handR);

        this.handL = this.handR.clone();
        this.handL.position.z = -this.handR.position.z;
        // this.handL.position.x += 35;
        this.body.add(this.handL);


        // toss
        let torsoGeom = new THREE.CubeGeometry(20, 20, 20, 1);
        this.torso = new THREE.Mesh(torsoGeom, brownMat);
        this.torso.position.y = 30;
        this.body.add(this.torso);


        // legs
        let legGeom = new THREE.CubeGeometry(8, 3, 5, 1);

        this.legR = new THREE.Mesh(legGeom, brownMat);
        this.legR.position.x = 0;
        this.legR.position.z = 7;
        this.legR.position.y = 0;
        this.legR.castShadow = true;
        this.body.add(this.legR);

        this.legL = this.legR.clone();
        this.legL.position.z = -this.legR.position.z;
        this.legL.castShadow = true;
        this.body.add(this.legL);
        this.threeGroup.add(this.body);
        this.threeGroup.traverse(function (object) {
            if (object instanceof THREE.Mesh && !noShadowMeshes.has(object.id)) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    }

    Run() {
        if (!onJump && !onBend) {

            this.runningCycle += .1;
            let t = this.runningCycle;
            t = t % (2 * PI);
            let amp = 4;

            this.legR.position.x = Math.cos(t) * amp;
            this.legR.position.y = Math.max(0, -Math.sin(t) * amp);

            this.legL.position.x = Math.cos(t + PI) * amp;
            this.legL.position.y = Math.max(0, -Math.sin(t + PI) * amp);

            if (t > PI) {
                this.legR.rotation.z = Math.cos(t * 2 + PI / 2) * PI / 4;
                this.legL.rotation.z = 0;
            } else {
                this.legR.rotation.z = 0;
                this.legL.rotation.z = Math.cos(t * 2 + PI / 2) * PI / 4;
            }

            this.torso.position.y = 30 - Math.cos(t * 2) * amp * .2;
            this.torso.rotation.y = -Math.cos(t + PI) * amp * .05;

            this.head.position.y = 60 - Math.cos(t * 2) * amp * .3;
            this.head.rotation.x = Math.cos(t) * amp * .02;
            //this.head.rotation.y = Math.cos(t) * amp * .01;

            this.handR.position.x = -Math.cos(t) * amp;
            this.handR.rotation.z = -Math.cos(t) * PI / 8;
            this.handL.position.x = -Math.cos(t + PI) * amp;
            this.handL.rotation.z = -Math.cos(t + PI) * PI / 8;

            //  this.rightEye.scale.y = this.leftEye.scale.y = .1 + Math.abs(Math.cos(t * .5 - 0.79)) * (1 - .1); // eyeyes blinks.
        }
    }

    idle() {
        TweenMax.killTweensOf(this.head.rotation);
        this.time += .03;

        if (Math.random() > .99) this.blink();

        if (this.isIdeling || Math.random() < .98) return;

        this.isIdeling = true;
        var tx = Math.random() * ((Math.PI / 12) - (-Math.PI / 12)) + -Math.PI / 12;
        // random number in the range (Math.PI / 2 + Math.PI / 8) to (Math.PI / 2 - Math.PI / 8).
        var ty = Math.random() * ((Math.PI / 2 + Math.PI / 8) - (Math.PI / 2 - Math.PI / 8)) + (Math.PI / 2 - Math.PI / 8);
        var tz = Math.random() * ((Math.PI / 12) - (-Math.PI / 12)) + -Math.PI / 12;
        var speed = .5 + Math.random() * 2;
        TweenMax.to(this.idelingPos, speed, {
            x: tx,
            y: ty,
            z: tz,
            ease: Power4.easeOut,
            onUpdate: () => {
                this.head.rotation.x = this.idelingPos.x;
                this.head.rotation.y = this.idelingPos.y;
                this.head.rotation.z = this.idelingPos.z;
            },
            onComplete: () => {
                this.isIdeling = false;
            }
        });
    }

    blink() {
        if (this.isBlinking) return;
        this.isBlinking = true;
        this.rightEye.scale.y = this.leftEye.scale.y = 1;
        TweenMax.to(this.rightEye.scale, .07, {
            y: 0,
            yoyo: true,
            repeat: 1
        });
        TweenMax.to(this.leftEye.scale, .07, {
            y: 0,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.isBlinking = false;
            }
        });
    }

}

Hero = function () {
    this.runningCycle = 0;
    this.mesh = new THREE.Group();
    this.body = new THREE.Group();
    this.mesh.add(this.body);

    let torsoGeom = new THREE.CubeGeometry(8, 8, 8, 1); //
    this.torso = new THREE.Mesh(torsoGeom, blueMat);
    this.torso.position.y = 8;
    this.torso.castShadow = true;
    this.body.add(this.torso);

    let handGeom = new THREE.CubeGeometry(3, 3, 3, 1);
    this.handR = new THREE.Mesh(handGeom, brownMat);
    this.handR.position.z = 7;
    this.handR.position.y = 8;
    this.body.add(this.handR);

    this.handL = this.handR.clone();
    this.handL.position.z = -this.handR.position.z;
    this.body.add(this.handL);

    let headGeom = new THREE.CubeGeometry(16, 16, 16, 1); //
    this.head = new THREE.Mesh(headGeom, blueMat);
    this.head.position.y = 21;
    this.head.castShadow = true;
    this.body.add(this.head);

    let legGeom = new THREE.CubeGeometry(8, 3, 5, 1);

    this.legR = new THREE.Mesh(legGeom, brownMat);
    this.legR.position.x = 0;
    this.legR.position.z = 7;
    this.legR.position.y = 0;
    this.legR.castShadow = true;
    this.body.add(this.legR);

    this.legL = this.legR.clone();
    this.legL.position.z = -this.legR.position.z;
    this.legL.castShadow = true;
    this.body.add(this.legL);

    this.body.traverse(function (object) {
        if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
};

Hero.prototype.Run = function () {
    this.runningCycle += .03;
    let t = this.runningCycle;
    t = t % (2 * PI);
    let amp = 4;

    this.legR.position.x = Math.cos(t) * amp;
    this.legR.position.y = Math.max(0, -Math.sin(t) * amp);

    this.legL.position.x = Math.cos(t + PI) * amp;
    this.legL.position.y = Math.max(0, -Math.sin(t + PI) * amp);

    if (t > PI) {
        this.legR.rotation.z = Math.cos(t * 2 + PI / 2) * PI / 4;
        this.legL.rotation.z = 0;
    } else {
        this.legR.rotation.z = 0;
        this.legL.rotation.z = Math.cos(t * 2 + PI / 2) * PI / 4;
    }

    this.torso.position.y = 8 - Math.cos(t * 2) * amp * .2;
    this.torso.rotation.y = -Math.cos(t + PI) * amp * .05;

    this.head.position.y = 21 - Math.cos(t * 2) * amp * .3;
    this.head.rotation.x = Math.cos(t) * amp * .02;
    this.head.rotation.y = Math.cos(t) * amp * .01;

    this.handR.position.x = -Math.cos(t) * amp;
    this.handR.rotation.z = -Math.cos(t) * PI / 8;
    this.handL.position.x = -Math.cos(t + PI) * amp;
    this.handL.rotation.z = -Math.cos(t + PI) * PI / 8;
};
let hero;

function createHero() {
    hero = new Hero();
    hero.mesh.rotation.y = -1.5;
    hero.mesh.position.x = 65;
    hero.mesh.position.y = 45;
    hero.mesh.scale.set(2, 2, 2);
    callBackMAp.set('hero', hero);
    scene.add(hero.mesh);
}


class Pilot {
    constructor() {
        this.mesh = new THREE.Object3D();
        this.mesh.name = 'pilot';

        // angleHairs is a property used to animate the hair later
        this.angleHairs = 0;

        // Body of the pilot
        let bodyGeom = new THREE.BoxGeometry(15, 15, 15);
        let bodyMat = new THREE.MeshPhongMaterial({
            color: Colors.brown,
            flatShading: true
        });
        this.body = new THREE.Mesh(bodyGeom, bodyMat);
        this.body.position.set(2, -12, 0);
        this.mesh.add(this.body);

        // Face of the pilot
        let faceGeom = new THREE.BoxGeometry(10, 10, 10);
        let faceMat = new THREE.MeshLambertMaterial({
            color: Colors.pink
        });
        this.face = new THREE.Mesh(faceGeom, faceMat);
        this.mesh.add(this.face);

        // Hair element
        let hairGeom = new THREE.BoxGeometry(4, 4, 4);
        let hairMat = new THREE.MeshLambertMaterial({
            color: Colors.brown
        });
        let hair = new THREE.Mesh(hairGeom, hairMat);
        // Align the shape of the hair to its bottom boundary, that will make it easier to scale.
        hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

        // create a container for the hair
        this.hairs = new THREE.Object3D();

        // create a container for the hairs at the top
        // of the head (the ones that will be animated)
        this.hairsTop = new THREE.Object3D();

        // create the hairs at the top of the head
        // and position them on a 3 x 4 grid
        let h, col, row, startPosZ, startPosX;
        for (let i = 0; i < 12; i++) {
            h = hair.clone();
            col = i % 3;
            row = Math.floor(i / 3);
            startPosZ = -4;
            startPosX = -4;
            h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
            this.hairsTop.add(h);
        }
        this.hairs.add(this.hairsTop);

        // create the hairs at the side of the face
        let hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
        hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
        let hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
        let hairSideL = hairSideR.clone();
        hairSideR.position.set(8, -2, 6);
        hairSideL.position.set(8, -2, -6);
        this.hairs.add(hairSideR);
        this.hairs.add(hairSideL);

        // create the hairs at the back of the head
        let hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
        let hairBack = new THREE.Mesh(hairBackGeom, hairMat);
        hairBack.position.set(-1, -4, 0);
        this.hairs.add(hairBack);
        this.hairs.position.set(-5, 5, 0);

        this.mesh.add(this.hairs);

        let glassGeom = new THREE.BoxGeometry(5, 5, 5);
        let glassMat = new THREE.MeshLambertMaterial({
            color: Colors.brown
        });
        let glassR = new THREE.Mesh(glassGeom, glassMat);
        glassR.position.set(6, 0, 3);
        let glassL = glassR.clone();
        glassL.position.z = -glassR.position.z;

        let glassAGeom = new THREE.BoxGeometry(11, 1, 11);
        let glassA = new THREE.Mesh(glassAGeom, glassMat);
        this.mesh.add(glassR);
        this.mesh.add(glassL);
        this.mesh.add(glassA);

        let earGeom = new THREE.BoxGeometry(2, 3, 2);
        let earL = new THREE.Mesh(earGeom, faceMat);
        earL.position.set(0, 0, -6);
        let earR = earL.clone();
        earR.position.set(0, 0, 6);
        this.mesh.add(earL);
        this.mesh.add(earR);
    }

    updateHairs() {
        // get the hair
        let hairs = this.hairsTop.children;

        // update them according to the angle angleHairs
        let l = hairs.length;
        for (let i = 0; i < l; i++) {
            let h = hairs[i];
            // each hair element will scale on cyclical basis between 75% and 100% of its original size
            h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
        }

        // increment the angle for the next frame
        this.angleHairs += 0.16;
    }
}


function some() {


    var boxes = $('.box'),
        boxesReversed = $('.box').get().reverse(),
        boxesS = $('.boxS'),
        dot = $('.dot'),
        green = '#89c540',
        tl = new TimelineMax({
            delay: 1,
            repeat: -1,
            repeatDelay: 3
        });

    tl.set(dot, {
        autoAlpha: 1
    }).staggerTo(boxes, 1, {
        cycle: {
            y: [100, -100],
            backgroundColor: ['white', green],
            ease: [Bounce.easeOut, Power4.easeOut],
        },
    }, 0.05).to(dot, 1, {
        x: '+=1000',
        ease: Power3.easeOut
    }, '-=0.98').set(dot, {
        rotation: 180,
        transformOrigin: 'center center',
    }).to(dot, 1, {
        x: '-=1000',
        ease: Power3.easeOut
    }).staggerTo(boxesReversed, 0.5, {
        cycle: {
            y: ['-=100', '+=100'],
            ease: [Power4.easeOut, Bounce.easeOut],
        },
        backgroundColor: 'white',
    }, 0.05, '-=0.6').to(boxesS, 0.3, {
        backgroundColor: green
    }, '-=0.6').set(dot, {
        rotation: 0,
        autoAlpha: 0
    });

}

function Walk() {
    let speed = 0.7;
    man.isIdeling = false;

    // change the diretion to the "road".
    TweenMax.to([man.threeGroup.rotation], speed, {
        y: -.3,
        ease: Bounce.easeOut,
    });
    realMap = callBackMAp;
}

function Stop() {
    let speed = 0.7;
    realMap = new Map();

    TweenMax.to(man.threeGroup.rotation, speed, {
        y: -Math.PI / 2,
        ease: Bounce.easeOut,
    });


    TweenMax.to([man.rightIris.scale, man.leftIris.scale], speed, {
        y: 0.1,
        ease: Power2.easeOut,
    });
    TweenMax.to([man.lips.scale], speed, {
        x: 0.1,
        y: 0.1,
        ease: Power2.easeOut,
    });


    setTimeout(function () {
        TweenMax.to([man.rightIris.scale, man.leftIris.scale], speed, {
            y: 1,
            ease: Power1.easeOut,
        });
        TweenMax.to([man.lips.scale], speed, {
            x: 1,
            y: 1,
            ease: Power2.easeInOut,
        });

    }, 1000);

    restorePosstion(man, newman, speed);
}

function restorePosstion(curMan, orgMan, speed) {
    // change man to the orginal positions.
    // head streaiet.

    TweenMax.to(curMan.head.rotation, speed, {
        x: orgMan.head.rotation.x,
        y: orgMan.head.rotation.y,
        z: orgMan.head.rotation.z,
        ease: Power1.easeOut,
    });
    TweenMax.to(curMan.head.position, speed, {
        y: orgMan.head.position.y,
        x: orgMan.head.position.x,
        z: orgMan.head.rotation.z,
        ease: Power2.easeInOut,
    });

    // left hand sthraeit.
    TweenMax.to(curMan.handL.position, speed, {
        x: orgMan.handL.position.x,
        ease: Power1.easeOut,
    });
    TweenMax.to(curMan.handL.rotation, speed, {
        z: orgMan.handL.rotation.z,
        ease: Power2.easeInOut,
    });

    // right hand 
    TweenMax.to(curMan.handR.position, speed, {
        x: orgMan.handR.position.x,
        ease: Power1.easeOut,
    });
    TweenMax.to(curMan.handR.rotation, speed, {
        z: orgMan.handR.rotation.z,
        ease: Power2.easeInOut,
    });

    //left leg
    TweenMax.to(curMan.legL.position, speed, {
        x: orgMan.legL.position.x,
        y: orgMan.legL.position.y,
        ease: Power1.easeOut,
    });
    TweenMax.to(curMan.legL.rotation, speed, {
        z: orgMan.legL.rotation.z,
        ease: Power2.easeInOut,
    });

    // right leg
    TweenMax.to(curMan.legR.position, speed, {
        x: orgMan.legR.position.x,
        y: orgMan.legR.position.y,
        ease: Power1.easeOut,
    });
    TweenMax.to(curMan.legR.rotation, speed, {
        z: orgMan.legR.rotation.z,
        ease: Power2.easeInOut,
    });

    // torso
    TweenMax.to(curMan.torso.position, speed, {
        y: orgMan.torso.position.y,
        ease: Power1.easeOut,
    });

    TweenMax.to(curMan.torso.rotation, speed, {
        y: orgMan.torso.rotation.y,
        ease: Power2.easeInOut,
    });
}


function Bend() {

    let speed = .7,
        beforeHandPos = man.head.position.y,
        beforeTorsPos = man.torso.position.y,
        beforeHanndRPos = man.handR.position.y,
        beforeHanndLPos = man.handL.position.y;

    if (!onBend) {
        onBend = true;
        onJump = false;
        TweenMax.to([man.rightIris.scale, man.leftIris.scale], speed, {
            y: 0.1,
            ease: Power2.easeOut,
        });

        TweenMax.to([man.head.position], speed, {
            y: beforeHandPos - 40,
            ease: Power2.easeOut
        });
        TweenMax.to([man.torso.position], speed, {
            y: beforeTorsPos - 30,
            ease: Power2.easeOut
        });

        TweenMax.to(man.handL.position, speed, {
            y: beforeHanndLPos - 30,
            ease: Power2.easeOut,
        });

        TweenMax.to(man.handR.position, speed, {
            y: beforeHanndRPos - 30,
            ease: Power2.easeOut,
        });

        setTimeout(() => {
            TweenMax.to([man.rightIris.scale, man.leftIris.scale], speed, {
                y: 1,
                ease: Power2.easeOut,
            });
            TweenMax.to([man.head.position], speed, {
                y: beforeHandPos,
                ease: Power2.easeOut
            });
            TweenMax.to([man.torso.position], speed, {
                y: beforeTorsPos,
                ease: Power2.easeOut
            });
            TweenMax.to(man.handL.position, speed, {
                y: beforeHanndLPos,
                ease: Power2.easeOut,
            });

            TweenMax.to(man.handR.position, speed, {
                y: beforeHanndRPos,
                ease: Power2.easeOut,
                onComplete: () => onBend = false
            });

        }, 700);
    }
}

let idle = false;

function Idle() {
    idle = !idle;
}

function Jump() {
    let speed = .7;
    let beforeHandPos = man.threeGroup.position.y,
        beforeHanndRPos = man.handR.position.y,
        beforeHanndLPos = man.handL.position.y;

    if (!onJump) {
        onJump = true;
        onBend = false;
        TweenMax.to([man.rightIris.scale, man.leftIris.scale], speed, {
            y: 0.1,
            ease: Power2.easeOut,
        });

        TweenMax.to(man.threeGroup.position, speed, {
            y: beforeHandPos + 30,
            ease: Back.easeOut.config(1.7),
        });


        TweenMax.to(man.handL.position, speed, {
            y: beforeHanndLPos + 10,
            ease: Back.easeOut.config(4.7),
        });

        TweenMax.to(man.handR.position, speed, {
            y: beforeHanndRPos + 10,
            ease: Back.easeOut.config(4.7),
        });

        setTimeout(function () {
            TweenMax.to([man.rightIris.scale, man.leftIris.scale], speed, {
                y: 1,
                ease: Power1.easeOut,
            });
            TweenMax.to([man.lips.scale], speed, {
                x: 1,
                y: 1,
                ease: Power2.easeInOut,
            });
            TweenMax.to(man.threeGroup.position, speed, {
                y: beforeHandPos,
                ease: Back.easeOut.config(5.7)
            });
            TweenMax.to(man.handL.position, speed, {
                y: beforeHanndLPos,
                ease: Back.easeOut.config(4.7),
            });

            TweenMax.to(man.handR.position, speed, {
                y: beforeHanndRPos,
                ease: Back.easeOut.config(4.7),
                onComplete: () => onJump = false,
            });

        }, 700);
    }
}


function cameraLookDir(camera) {
    var vector = new THREE.Vector3(0, 0, -1);
    vector.applyEuler(camera.rotation, camera.eulerOrder);
    return vector;
}