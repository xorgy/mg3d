var start = Date.now();

var near = 0.1;
var dist = 20;

var DRIFT_DAMPING = 0.25;

Math.TAU = Math.PI * 2;

var fogDensity = 0.2;

var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2( 0xffffff, fogDensity );

var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, dist);
var cameraChanged = false;

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

window.onresize = function() {
  renderer.setSize( window.innerWidth, window.innerHeight );
  camera.aspect = window.innerWidth / window.innerHeight;
  cameraChanged = true;
};

function absmin(a, b) {
  return Math.abs(a) < Math.abs(b)? a: b;
}

var controlX = 0, controlY = 0;

window.onmousemove = function(e) {
  function pc(p) {
    return [
      Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2)),
      Math.atan2(p[1], p[0])
    ];
  }

  function ec(p) {
    return [
      p[0] * Math.cos(p[1]),
      p[0] * Math.sin(p[1])
    ];
  }

  function clamp(min, max, v) {
    return v > max? max: v < min? min: v;
  }

  var eX, eY, min, max;

  if(window.innerWidth >= window.innerHeight) {
    min = (window.innerWidth - window.innerHeight) / 2;
    max = window.innerHeight;

    eX = clamp(min,min + max, e.pageX) - min;
    eY = e.pageY;
  } else {
    min = (window.innerHeight - window.innerWidth) / 2;
    max = window.innerWidth;

    eY = clamp(min, min + max, e.pageY) - min;
    eX = e.pageX;
  }

  var relx = (eX / max) - 0.5;
  var rely = -((eY / max) - 0.5);

  var polar = pc([relx * 2, rely * 2]);

  polar[0] = absmin(polar[0], 0.45);

  var euclidean = ec(polar);

  controlX = euclidean[0];
  controlY = euclidean[1];
};

var railsMesh;

function buildRails() {

  var rails = [
    [ [ -0.188, 0.982 ], [ -0.125, 0.992 ] ],
    [ [ 0.875, 0.484 ], [ 0.904, 0.425 ] ],
    [ [ 0.729, -0.683 ], [ 0.684, -0.728 ] ],
    [ [ -0.424, -0.904 ], [ -0.482, -0.875 ] ],
    [ [ -0.99, 0.125 ], [ -0.982, 0.187 ] ]
  ];

  var geom = new THREE.Geometry();
  var base = 0;
  function bt(x) {
    return base + x;
  }

  function rail(v) {
    var a = v[0];
    var b = v[1];
    geom.vertices.push(new THREE.Vector3(a[0] * 0.5, a[1] * 0.5, near));
    geom.vertices.push(new THREE.Vector3(b[0] * 0.5, b[1] * 0.5, near));
    geom.vertices.push(new THREE.Vector3(a[0] * 0.5, a[1] * 0.5, dist));
    geom.vertices.push(new THREE.Vector3(b[0] * 0.5, b[1] * 0.5, dist));
    geom.faces.push(new THREE.Face3(bt(0), bt(1), bt(2)));
    geom.faces.push(new THREE.Face3(bt(1), bt(2), bt(3)));
    base += 4;
  }

  rails.map(rail);

  // material
  var mat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide});
  //  form mesh of geometry + material and add it to the scene
  var mesh = new THREE.Mesh(geom, mat);
  railsMesh = mesh;
  scene.add(railsMesh);
}

buildRails();

function buildTangentTriangle(grey) {
  function ec(p) {
    return [
      p[0] * Math.cos(p[1]),
      p[0] * Math.sin(p[1])
    ];
  }
  var geom = new THREE.Geometry();

  geom.vertices.push(new THREE.Vector3(0, 1, near));
  geom.vertices.push(new THREE.Vector3(-0.8660254037844384, -0.5, near));
  geom.vertices.push(new THREE.Vector3(0.8660254037844384, -0.5 , near));
  geom.faces.push(new THREE.Face3(0, 1, 2));

  // material
  var mat = new THREE.MeshBasicMaterial({color: 0x422D3F, side: THREE.FrontSide});

  var uniforms = {
    fogDensity:  { type: "f", value: fogDensity },
    grey:        { type: "f", value: grey  }
  };

  var material = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: THREE.ShaderChunk.common + '\n' + document.getElementById( 'barrier2Shader' ).textContent,
    transparent: true
  } );

  var geo = new THREE.BufferGeometry();
  geo.fromGeometry(geom);

  return new THREE.Mesh(geo, material);
}

var tangentTriangle = buildTangentTriangle(1.0);
var tangentTriangle2 = buildTangentTriangle(0.6);

scene.add(tangentTriangle);
scene.add(tangentTriangle2);

var geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
var material = new THREE.MeshBasicMaterial( { color: 0x422D3F } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = dist;

var time = Date.now();

function render() {
  requestAnimationFrame( render );

  var ctime = Date.now();
  var frametime = ctime - time;
  time = ctime - start;

  // If the camera parameters have changed, we should update the projection matrix.
  if(cameraChanged) {
    camera.updateProjectionMatrix();
    cameraChanged = false;
  }

  railsMesh.rotation.z = (0.35 * (time / 1000)) % Math.TAU;


  tangentTriangle.position.z = (((time / 1000) * 0.5) % 1) * dist;
  tangentTriangle2.position.z = ((((time / 1000) * 0.5) % 1) * dist) - 0.05;

  // Make the camera bob up and down for no particular reason.
  //  camera.position.z = Math.sin(((Date.now() - start) / 100) % Math.TAU) + 4;

  renderer.render( scene, camera );
}

render();

var ticklength = 16;
var currentX = 0, currentY = 0;

function tick() {
  window.setTimeout(tick, 16);
  var dt = ticklength / 1000;

  tangentTriangle.rotation.z += 0.05;
  tangentTriangle2.rotation.z += 0.05;

  currentX += (controlX - currentX) * dt / DRIFT_DAMPING;
  currentY += (controlY - currentY) * dt / DRIFT_DAMPING;

  camera.position.x = currentX;
  camera.position.y = currentY;
}

tick();
