import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const keys = {};
window.addEventListener('keydown', (event) => {
  keys[event.code] = true;
});
window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});
function main() {
  //Scene Setup
  const canvas = document.querySelector( '#c' );
  const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );

  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 30;
  
  //Camera Controls
  const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
  camera.position.set( 0, 0.5, -1.5 );

  const controls = new OrbitControls( camera, canvas );
  controls.target.set( 0, 1, 0 );
  controls.update();

  const scene = new THREE.Scene();
  {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
        'skybox.png',
        () => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          scene.background = texture;
        });
  }

  //Plane
  {
    const planeSize = 100;

    const loader = new THREE.TextureLoader();
    const texture = loader.load( 'grass.png' );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize*2;
    texture.repeat.set( repeats, repeats );

    const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
    const planeMat = new THREE.MeshPhongMaterial( {
      map: texture,
      side: THREE.DoubleSide,
    } );
    const mesh = new THREE.Mesh( planeGeo, planeMat );
    mesh.rotation.x = Math.PI * - .5;
    scene.add( mesh );

  }
  function frameArea( sizeToFitOnScreen, boxSize, boxCenter, camera ) {

    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad( camera.fov * .5 );
    const distance = halfSizeToFitOnScreen / Math.tan( halfFovY );
    const direction = ( new THREE.Vector3() )
        .subVectors( camera.position, boxCenter )
        .multiply( new THREE.Vector3( 1, 0, 1 ) )
        .normalize();

    camera.position.copy( direction.multiplyScalar( distance ).add( boxCenter ) );

    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    camera.lookAt( boxCenter.x, boxCenter.y, boxCenter.z );

  }
  //Primary shapes
  const primaryShapes = [];
  {
    const cube = new THREE.BoxGeometry(0.5,0.5,0.5);
    const sphere = new THREE.SphereGeometry(0.5,0.5,128);
    const cylinder = new THREE.CylinderGeometry(0.5,0.5,1,16);
    const loader = new THREE.TextureLoader();
    const texture = loader.load( 'wall.png' );
    texture.colorSpace = THREE.SRGBColorSpace;
    const texturedmaterial = new THREE.MeshBasicMaterial( {
      map: texture,
    } );
    
    for ( let i = 0; i < 20; i++ ) {
      let geometry, material;
      if (i % 3 == 0){
        geometry = cube;
        material = texturedmaterial;
      }
      else if (i % 3 == 1){
        geometry = sphere;
        material = new THREE.MeshBasicMaterial({color: 0xffffff});
      }
      else {
        geometry = cylinder;
        material = new THREE.MeshPhongMaterial({color: 0xffffff});
      }
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set((Math.random() - 0.5)*10, 0.25, (Math.random() - 0.5)*10);
      scene.add(mesh);
      primaryShapes.push(mesh);
    }
  }
  
  
  //Ambient light
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
  }
  class ColorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }
    get value() {
      return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
  }


  
  //Hemisphere light
  {
    const skyColor = 0xB1E1FF; // light blue
    const groundColor = 0xB97A20; // brownish orange
    const intensity = 2;
    const light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
    scene.add( light );
  }
  
  //Directional light
  {
    const color = 0xFFFFFF;
    const intensity = 2.5;
    const light = new THREE.DirectionalLight( color, intensity );
    light.position.set( 0, 10, 0 );
    light.target.position.set( - 5, 0, 0 );
    scene.add( light );
    scene.add( light.target );

    const gui = new GUI();
    gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
    gui.add(light, 'intensity', 0, 5, 0.01);
    gui.add(light.target.position, 'x', -10, 10);
    gui.add(light.target.position, 'z', -10, 10);
    gui.add(light.target.position, 'y', 0, 10);
  }
  
    
  
  // Instantiate a loader
  const loader = new GLTFLoader();

// Load a glTF resource
  loader.load(
      // resource URL
      'Snorlax.glb',
      // called when the resource is loaded
      function ( gltf ) {

        scene.add( gltf.scene );
        gltf.scene.position.set(0, 0.25, 0);

        gltf.animations; // Array<THREE.AnimationClip>
        gltf.scene; // THREE.Group
        gltf.scenes; // Array<THREE.Group>
        gltf.cameras; // Array<THREE.Camera>
        gltf.asset; // Object

      },
      // called while loading is progressing
      function ( xhr ) {

        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

      },
      // called when loading has errors
      function ( error ) {

        console.log( 'An error happened' );

      }
  );
  
  
  

  function resizeRendererToDisplaySize( renderer ) {

    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if ( needResize ) {
      renderer.setSize( width, height, false );
    }

    return needResize;

  }
  
  function render( time ) {
    time *= 0.001; // convert time to seconds
    if ( resizeRendererToDisplaySize( renderer ) ) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    
    primaryShapes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .01;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    })
    
    //WASD movement
    const speed = 0.05;
    if (keys['KeyW ']) camera.position.z += speed;
    if (keys['KeyS']) camera.position.z -= speed;
    if (keys['KeyA']) camera.position.x += speed;
    if (keys['KeyD']) camera.position.x -= speed;

    // Optional: update controls target so camera always looks forward
    controls.target.set(0, 0, 0);
    controls.update();
    
    renderer.render( scene, camera );
    requestAnimationFrame( render );
  }

  requestAnimationFrame( render );
}
main();