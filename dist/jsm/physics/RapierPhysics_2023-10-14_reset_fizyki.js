/*----------------------------------------------+
| RapierPhysics.js								|
| Edited by: Paweł Drabowicz					|
| Modified date: 2023-10-08						|
+-----------------------------------------------+
| Physics now can be add to GLF imported model.	|
+----------------------------------------------*/

async function RapierPhysics(THREE)
{
	const RAPIER = await import('https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2'); // Docs: https://rapier.rs/docs/api/javascript/JavaScript3D/
	await RAPIER.init();
			
	const frameRate = 60;
	const vector	= {x: 0.00, y: 0.00, z: 0.00};
	const gravity	= {x: 0.00, y:-9.81, z: 0.00};
	const world		= new RAPIER.World(gravity);
	const meshMap	= new WeakMap();
	const meshes	= [];
	
	let linearVelocity	= {x: 3, y: 4, z: 4};
	
	let lastTime		= 0;
	
	
	function addMesh(mesh, mass = 0, restitution = 0)
	{
		const shape = getCollider(mesh.geometry, mesh); // Make shape from geometry (box, sphere or loaded object model)
		
		if(shape !== null) 
		{
			shape.setMass(mass);
			shape.setRestitution(restitution);
			
			if(mesh.isInstancedMesh) 
			
			handleInstancedMesh	(mesh, mass, shape); else if(mesh.isMesh) 
			handleMesh			(mesh, mass, shape);
		}
	}
	
	
	function getCollider(geometry, mesh)
	{
		const parameters = geometry.parameters; // TODO change type to is*
		
		switch(geometry.type)
		{
			case 'BoxGeometry':
				
				const sx = parameters.width		!== undefined ? parameters.width	/ 2 : 0.5;
				const sy = parameters.height	!== undefined ? parameters.height	/ 2 : 0.5;
				const sz = parameters.depth		!== undefined ? parameters.depth	/ 2 : 0.5;
				return RAPIER.ColliderDesc.cuboid(sx, sy, sz);
				
			break;
			
			case 'SphereGeometry':
				
				var radius = parameters.radius !== undefined ? parameters.radius : 1;
				return RAPIER.ColliderDesc.ball(radius);
				
			break;
			
			case 'IcosahedronGeometry':
				
				var radius = parameters.radius !== undefined ? parameters.radius : 1;
				return RAPIER.ColliderDesc.ball(radius);
				
			break;
			
			case 'BufferGeometry':
			{
				let
				
				position	= {x: 0,	y: 0,	z: 0},
				quaternion	= {x: 0,	y: 0,	z: 0,	w: 1},
				mass		= 5;
				
				let triangles	= [];
				let points		= geometry.getAttribute('position').array;
				
				for(let i = 0; i < points.length; i+= 3)
				{
					triangles.push
					(
						{
							x: points[i + 0], 
							y: points[i + 1], 
							z: points[i + 2]
						}
					)
				}
				
				let indices = new RAPIER.Vector3(0, 1, 2);
				
				let vectA	= new RAPIER.Vector3(0, 0, 0);
				let vectB	= new RAPIER.Vector3(0, 0, 0);
				let vectC	= new RAPIER.Vector3(0, 0, 0);
				
				var triangleGeometry	= new THREE.BufferGeometry();
				var triangleMaterial	= new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, wireframeLinewidth: 1});
				var triangle_mesh		= new THREE.Mesh(triangleGeometry, triangleMaterial);
				
				for(let i = 0; i < triangles.length - 3; i+= 3)
				{
					vectA[triangles[i + 0].x, triangles[i + 0].y, triangles[i + 0].z];
					vectB[triangles[i + 1].x, triangles[i + 1].y, triangles[i + 1].z];
					vectC[triangles[i + 2].x, triangles[i + 2].y, triangles[i + 2].z];
					
					triangle_mesh.vertices = [vectA, vectB, vectC]; //triangle_mesh.faces.push(new THREE.Triangle().setFromAttributeAndIndices([vectA, vectB, vectC], 0, 1, 2)); //THREE.GeometryUtils.center(triangleGeometry);
				}
				
				const 
				
				transform					= mass > 0 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed();
				transform.setTranslation	(position.x, position.y, position.z);
				transform.setRotation		(quaternion.x, quaternion.y, quaternion.z, quaternion.w); //alert(JSON.stringify(mesh.instanceMatrix.array));
				
				let shape = new RAPIER.Shape(); //shape.trimesh(triangle_mesh, indices); //let shapeType	= new RAPIER.TriMesh(triangle_mesh, indices);
				
				//handleInstancedMesh(mesh, mass, shape); //this.handleInstancedMesh(meshInstance, shape, 5, Ammo);
				
				return RAPIER.ColliderDesc.convexMesh(points);
			}
			
			default:
				
				alert(geometry.type);
				
			break;
		}
		
		return null;
	}
			
			
	function handleMesh(mesh, mass, shape) 
	{
		const position		= mesh.position;
		const quaternion	= mesh.quaternion;
		const desc			= mass > 0 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed();
		
		desc.setTranslation	(position.x, position.y, position.z);
		desc.setRotation	(quaternion);
		
		const body 
		= 
		world.createRigidBody	(desc);
		world.createCollider	(shape, body);
		
		if(mass > 0) 
		{
			meshes.push(mesh);
			meshMap.set(mesh, body);
		}
	}
	
	
	function handleInstancedMesh(mesh, mass, shape) 
	{
		const array		= mesh.instanceMatrix.array;
		const bodies	= [];
		
		for(let i = 0; i < mesh.count; i++) 
		{
			const index = i * 16;
			
			const 
			
			desc = mass > 0 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed();
			desc.setTranslation(array[index + 12], array[index + 13], array[index + 14]);
			
			const body 
			= 
			world.createRigidBody(desc);
			world.createCollider(shape, body);
			
			bodies.push(body);
		}
		
		if(mass > 0) 
		{
			meshes.push(mesh);
			meshMap.set(mesh, bodies);
		}
	}
	
	
	function setMeshPosition(mesh, position, index = 0) 
	{
		if(mesh.isInstancedMesh) 
		{
			const bodies = meshMap.get(mesh);
			const 
				
			body = bodies[index];
			body.setAngvel(vector);
			body.setLinvel(vector);
			body.setTranslation(position);
		} 
		else if (mesh.isMesh) 
		{
			const 
			
			body = meshMap.get(mesh);
			body.setAngvel(vector);
			body.setLinvel(vector);
			body.setTranslation(position);
		}
	}
	
	
	function setMeshLinearVelocity(mesh, linearVelocity, index = 0)
	{
		if(mesh.isInstancedMesh) 
		{
			const bodies = meshMap.get(mesh);
			const 
				
			body = bodies[index];
			//body.setAngvel(vector);
			body.setLinvel(linearVelocity);
			//body.setTranslation(position);
		} 
		else if(mesh.isMesh) 
		{
			const 
			
			body = meshMap.get(mesh);
			//body.setAngvel(vector);
			body.setLinvel(linearVelocity);
			//body.setTranslation(position);
		}
	}
	
	function setMeshResetPhysics(meshPhysics)
	{
		let
		
		mesh			= meshPhysics.mesh,
		mass			= meshPhysics.mass,
		position		= meshPhysics.position,
		linearVelocity	= meshPhysics.linearVelocity,
		angularVelocity	= meshPhysics.angularVelocity,
		index			= meshPhysics.index,
		
		quaternion	= {x: 0,	y: 0,	z: 0,	w: 1};
		
		//alert('index: ' + index + '\r\nposition: ' + JSON.stringify(meshPhysics.position) + '\r\nlinearVelocity: ' + JSON.stringify(linearVelocity));
		
		if(mesh.isInstancedMesh) 
		{
			var array = mesh.instanceMatrix.array;
			var bodies = meshMap.get(mesh);
					
			var 
					
			body = bodies[index];
			body.resetForces(true);
			body.resetTorques(true);
					
			//position	= body.translation();
			//quaternion	= body.rotation();
						
			body.setTranslation	(position);
			body.setRotation	(quaternion);
			body.setAngvel(angularVelocity);
			body.setLinvel(linearVelocity);
			
			
			//position		= body.translation();
			//quaternion	= body.rotation();
			
			compose(position, quaternion, array, index * 16);
					
				
			//mesh.computeBoundingSphere();
				
		} 
		else if(mesh.isMesh) 
		{
				var
				
				body = meshMap.get(mesh);
				body.resetForces(true);
				body.resetTorques(true);
				
				mesh.position.copy	(body.translation());
				mesh.quaternion.copy(body.rotation());
		}
	}
	
	function step() 
	{
		const time = performance.now();
		
		if(lastTime > 0) 
		{
			const delta = (time - lastTime) / 1000;
			
			world.timestep = delta;
			world.step();
			
			for(let i = 0, l = meshes.length; i < l; i++) 
			{
				const mesh = meshes[i];
				
				if(mesh.isInstancedMesh) 
				{
					const array = mesh.instanceMatrix.array;
					const bodies = meshMap.get(mesh);
					
					for(let j = 0; j < bodies.length; j++) 
					{
						const body			= bodies[j];
						const position		= body.translation();
						const quaternion	= body.rotation();
						
						compose(position, quaternion, array, j * 16);
					}
					
					mesh.instanceMatrix.needsUpdate = true;
					mesh.computeBoundingSphere();
				} 
				else if(mesh.isMesh) 
				{
					const body = meshMap.get(mesh);
					
					mesh.position.copy	(body.translation());
					mesh.quaternion.copy(body.rotation());
				}
			}
		}

		lastTime = time;
	}
	
	
	function compose( position, quaternion, array, index) 
	{
		const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
		
		const x2 = x + x,	y2 = y + y,		z2 = z + z;
		const xx = x * x2,	xy = x * y2,	xz = x * z2;
		const yy = y * y2,	yz = y * z2,	zz = z * z2;
		const wx = w * x2,	wy = w * y2,	wz = w * z2;
		
		array[index + 0 ] = (1 - (yy + zz));
		array[index + 1 ] = (xy + wz);
		array[index + 2 ] = (xz - wy);
		array[index + 3 ] = 0;
			
		array[index + 4 ] = (xy - wz);
		array[index + 5 ] = (1 - (xx + zz));
		array[index + 6 ] = (yz + wx);
		array[index + 7 ] = 0;
		
		array[index + 8 ] = (xz + wy);
		array[index + 9 ] = (yz - wx);
		array[index + 10] = (1 - (xx + yy));
		array[index + 11] = 0;
		
		array[index + 12] = position.x;
		array[index + 13] = position.y;
		array[index + 14] = position.z;
		array[index + 15] = 1;
	}
	
	
	setInterval(step, 1000 / frameRate);
	
	
	return {addMesh: addMesh, setMeshPosition: setMeshPosition, setMeshLinearVelocity: setMeshLinearVelocity, setMeshResetPhysics: setMeshResetPhysics};
	
	//physics = {addMesh: addMesh, setMeshPosition: setMeshPosition};
}

export {RapierPhysics};