import * as THREE					from "three";
			import Stats						from "./libs/stats.module.js";				// Statistics
			import {GUI}						from "./libs/lil-gui.module.min.js";		// User interface
			import {Water}						from "./objects/Water.js";					// Water effect
			import {OrbitControls}				from "./jsm/controls/OrbitControls.js";		// Controls Mouse
			import {DragControls}				from "./jsm/controls/DragControls.js";		// Controls Drag&Drop
			import {GLTFLoader}					from "./jsm/loaders/GLTFLoader.js";			// GLT loader
			import {FBXLoader}					from "./jsm/loaders/FBXLoader.js";			// FBX import

            

 	
			function getOrientation()
			{
				let
				
				width		= window.innerWidth		|| document.body.offsetWidth	|| document.documentElement.offsetWidth,
				height		= window.innerHeight	|| document.body.offsetHeight	|| document.documentElement.offsetHeight,
				orientation	= window.orientation	!= undefined? window.orientation : height > width ? 0 : 90;
				
				switch(orientation)
				{
					case 0:		orientation = 'portrait';			// portrait (window width < window height)
					case 180:	orientation = 'portrait'; break;	// portrait (window width < window height)
					case -90:	orientation = 'landscape';			// landscape (window width > window height)
					case 90:	orientation = 'landscape'; break;	// landscape (window width > window height)
				}
					
				return orientation;
			}
			
			function getDistance3d	(x1, y1, z1, x2, y2, z2)	{return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));}
			function getDistance2d	(x1, y1, x2, y2)			{return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));}
			function getAngle2d		(x1, y1, x2, y2)			{return Math.atan2(x2 - x1, y2 - y1);}
			function Replace(search, replace, subject)			{return subject.split(search).join(replace);}
			function Flo2Dec(number, precision = 1)				{if(!(!isNaN(parseFloat(number)) && isFinite(number))) number = 0; precision = typeof precision !== 'undefined'? precision : 1; number = parseFloat((number).toFixed(precision)); return ((number === parseInt(number, 10))? (number + '.0') : (number));}
			function Deg2Rad(degree)							{return degree / 57.29;}
			function Rad2Deg(radian)							{return radian * 57.29;}
			function Rad2Qua(x, y, z)							{let qua = new THREE.Quaternion(); qua.setFromEuler(new THREE.Euler(x, y, z, 'XYZ')); return qua;}
			function Qua2Rad(qua)								{let angle = 2 * Math.acos(qua.w), sqrt = (1 - qua.w * qua.w < 0.000001)? (1) : (Math.sqrt(1 - qua.w * qua.w)); return {x: qua.x / sqrt, y: qua.y / sqrt, z: qua.z / sqrt, w: angle};}
			function Pix2Per(pix, pixSize, perSize)				{return pix / pixSize * perSize - perSize / 2; /*pix - pixel position (768px), pixSize - image size (ex. 1024px), perSize - polygon size (128)*/}
			
			class ENGINE
			{
				debug	= false;
				mobile	= 'ontouchstart' in window;
				safari	= navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && navigator.userAgent.indexOf('CriOS') == -1 && navigator.userAgent.indexOf('FxiOS') == -1;
				
				constructor()
				{
					this.time = 0;
				}
				
				ENGINE_init(parameters)
				{
					this.THREE			= parameters.THREE;
					this.Water			= parameters.Water;
					this.FBXLoader		= parameters.FBXLoader;
					this.GLTFLoader		= parameters.GLTFLoader;
					this.OrbitControls	= parameters.OrbitControls;
					
					//--------------------------------------------------
					
					this.textureCube			= new this.THREE.CubeTextureLoader().setPath('shape&textures/'); 
					this.textureCube.encoding	= this.THREE.sRGBEncoding; 
					this.textureCube.mapping	= this.THREE.EquirectangularReflectionMapping;
					
					//--------------------------------------------------
					
					this.scene					= new this.THREE.Scene();
					this.scene.fog				= new this.THREE.Fog(0x71862a, 32, 128); 
					this.scene.background		= this.textureCube.load(['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']);
					this.scene.environment		= this.textureCube.load(['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']);
					
					//--------------------------------------------------
					
					this.camera							= new this.THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 256);
					this.camera.position.set			(-15, 15, 0);
					this.camera.updateProjectionMatrix();
					
					//--------------------------------------------------
									
					this.hemiLight						= new this.THREE.HemisphereLight(0x000000, 0xffffff, 0.25);
					this.hemiLight.color.setHSL			(0.6, 0.6, 0.6);
					this.hemiLight.groundColor.setHSL	(0.1, 1,   0.4);
					this.hemiLight.position.set			(0, 32, 0);
					this.scene.add(this.hemiLight);
					
					//--------------------------------------------------
					
					this.dirLight						= new this.THREE.DirectionalLight(0xffffff, 1); let d = 64;
					this.dirLight.color.setHSL			(0.1, 1, 0.95);
					this.dirLight.position.set			(64, 48, 32);
					this.dirLight.position.multiplyScalar(256);
					this.dirLight.castShadow			= false;
					this.dirLight.shadow.mapSize.width	= 2048;
					this.dirLight.shadow.mapSize.height	= 2048; 
					this.dirLight.shadow.camera.left	= -d;
					this.dirLight.shadow.camera.right	= d;
					this.dirLight.shadow.camera.top		= d;
					this.dirLight.shadow.camera.bottom	= -d;
					this.dirLight.shadow.camera.far		= 256;
					this.scene.add(this.dirLight);
					
					//--------------------------------------------------
					
					this.renderer						= new this.THREE.WebGLRenderer({antialias: true}); 
					this.renderer.setClearColor			(0x71862a);
					this.renderer.setPixelRatio			(window.devicePixelRatio);
					this.renderer.setSize				(window.innerWidth, window.innerHeight); document.body.appendChild(this.renderer.domElement);
					this.renderer.gammaInput			= true;
					this.renderer.gammaOutput			= true;
					this.renderer.shadowMap.enabled		= true;
					
					//--------------------------------------------------
					
					this.controls						= new this.OrbitControls(this.camera, this.renderer.domElement);
					this.controls.autoRotate			= false;
					this.controls.autoRotateSpeed		= false;
					this.controls.minDistance			= 11.6;
					this.controls.maxDistance			= 23.8;
					this.controls.enablePan				= false;
					this.controls.enableZoom			= true;
					this.controls.enableDamping			= true;
					this.controls.dampingFactor			= 0.28;	// współczynnik tłumienia
					this.controls.update();	window.addEventListener
					(
						'resize', function ()
						{
							engine.renderer.setSize(window.innerWidth, window.innerHeight);
							engine.camera.aspect = window.innerWidth / window.innerHeight; 
							engine.camera.updateProjectionMatrix();
						}
					);
					
					
					//==============================_==============================================================
					// ZadekodujiZatenteguj obierk |v| "this.bar_zords" i Towy!czy?Szczaj do ToOniejego złamordhood
					//==============================-==============================================================
					this.bar_zords			= new this.THREE.Mesh();
					this.loader			= new this.GLTFLoader(); 
					this.loader.load
					(
						'shape&textures/FuraTslA_zlaBierud0lano_pokolorawano(przezR&B).gltf', function(gltf) 
						{ 
							engine.bar_zords = gltf.scene; // Iteracja przez wszystkie części modelu
							
							engine.scene.add(engine.bar_zords);
							
							engine.bar_zords.traverse
							(
								function(child) 
								{ 
									if(child.isMesh) 
									{ 
										//===================================================================
										// Można tu dodać dowolne modyfikacje dla każdej części
										//===================================================================
										child.material = new engine.THREE.MeshPhongMaterial
										(
											{
												color:			child.material.color, 
												side:			engine.THREE.DoubleSide, 
												envMap:			engine.scene.environment, 
												reflectivity:	0.9
											}
										); 
									}
									
									//child.position.y = -0.006;
								}
							);
							
							engine.bar_zords.position.x = 0;
							engine.bar_zords.position.y = -0.35;
							engine.bar_zords.position.z = 0;
							engine.bar_zords.name = 'bar_zords';
							engine.bar_zords.scale.set(1.2, 1.2, 1.2);
							engine.bar_zords.rotation.set(0 ,3.14 ,0 );
						}
					);
									
					//===================================================================
					// Dodanj pudeło i dodaj je do sceny komendą "this.scene.add(cube);"
					//===================================================================
					// var geometry	= new this.THREE.BoxGeometry(2, 4, 8); 
					var material	= new this.THREE.MeshPhongMaterial
					(
						{
							map:		new this.THREE.TextureLoader().load('shape&textures/texture-ground-grass-01-512x512-c.png'), 
							envMap: 	this.scene.environment,
							bumpMap:	new this.THREE.TextureLoader().load('shape&textures/texture-ground-grass-01-512x512-h.png')
						}
					);
					var cube		= new this.THREE.Mesh(geometry, material);
					
					cube.name			= 'pudlo';
					cube.position.set	(6, -0.5, 6); 
					cube.rotation.set	(Deg2Rad(-30), Deg2Rad(45), Deg2Rad(60)); 
					
					this.scene.add(cube);
					
					
					//===================================================================
					// Dodana kulę (duża, jesteś w jej wnętrzu) i dodaj je do sceny
					//===================================================================
					var geometry	= new this.THREE.SphereGeometry(24, 24, 16);
					var material	= new this.THREE.MeshPhongMaterial
					(
						{
							map:			new this.THREE.TextureLoader().load('shape&textures/texture-512x512-water.png'), 
							envMap: 		new this.THREE.TextureLoader().load('shape&textures/texture-512x512-water.png'),
							bumpMap:		new this.THREE.TextureLoader().load('shape&textures/texture-512x512-water.png'),
							side:			this.THREE.DoubleSide,
							//wireframe:		parseInt(Math.random() * 2.0) == 0? true : false, //losuje czy są krawędzie, jak false to przywrócisz przezroczystość
							transparent:	true,
							opacity:		0.51
						}
					);
					var sphere		= new this.THREE.Mesh(geometry, material);
					//var myOutline	= new OutlineMesh(sphere);
					
					this.scene.add(sphere);
					
					
					//===================================================================
					// Dodana wodę
					//===================================================================
					var water = new this.Water
					(
						new this.THREE.PlaneGeometry(256, 256),
						{
							textureWidth:		512,
							textureHeight:		512,
							sunColor:			0xffffff,
							sunDirection:		new this.THREE.Vector3(),
							distortionScale:	0.25,
							waterColor:			0x001e0f,
							fog:				this.scene.fog !== undefined,
							waterNormals:		new this.THREE.TextureLoader().load
							(
								'shape&textures/waternormals.jpg', function (texture)
								{
									texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
								}
							)
						}
					);
					water.position.y = -0.25;
					water.rotation.x = -Math.PI / 2;
					this.scene.add(water);
					
					
					//===================================================================
					// wywołaj pętle "loop" to po angielsku "pętla"
					//===================================================================
					this.ENGINE_loop();
				}
				
				
				ENGINE_loop()
				{
				
					//===================================================================
					// Gdy w linii 100 ustawisz debug na "true" możesz wyświetlać zmienne
					//===================================================================
					if(this.debug == false)
					{
						document.getElementById('debug').innerHTML 
						= 
						'HarvaHuraGUNa PupanicYon: iXavier=' + Flo2Dec(this.camera.position.x+555)	+ ', YE@AH!=' + Flo2Dec(this.camera.position.y)	+ ', ZIBA!=' + Flo2Dec(this.camera.position.z) + '+666=' + Flo2Dec(this.camera.rotation.z+44) + ' :) ' + '<br>' + 
						'commura rUraMutation: xenN0N=' + Flo2Dec(this.camera.rotation.x+1000)		+ ', Y0U "Q" rucha€!_oT<_co! oHo No!!! "00' + Math.trunc(Math.abs((this.camera.rotation.y)*10),false) + '"' + '<br>' 	+ ', inZYGM@=' + Flo2Dec(this.camera.rotation.z) + '+1!=' + Flo2Dec((this.camera.position.z)-(this.camera.rotation.z)) + ' :( ';
					}
					
					
					this.controls.update();
					this.renderer.render(this.scene, this.camera);
					
					
					
					this.fpsCounter++;
					
					requestAnimationFrame(() => this.ENGINE_loop());
				}
			}
			
			const engine = new ENGINE();
		 //-------------------------
		 // INIT PROGRAM
		 //-------------------------
		 window.addEventListener
		 (
			 'load', function() 
			 {		
				 engine.ENGINE_init
				 (
					 {
						 THREE:			THREE, 
						 Water:			Water,
						 FBXLoader:		FBXLoader,
						 GLTFLoader:	GLTFLoader, 
						 OrbitControls:	OrbitControls,
					 }
				 );
			 }, 
			 false
		 );