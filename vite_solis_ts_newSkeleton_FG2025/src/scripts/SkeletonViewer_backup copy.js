// SkeletonViewer.js
import * as THREE from "three";
import { BVHLoader } from "../../build/BVHLoader.js";
import Stats from "../../build/stats.module.js";
import { GPUStatsPanel } from "../../build/GPUStatsPanel.js";

import { Line2 } from "../../build/lines/Line2.js";
import { LineMaterial } from "../../build/lines/LineMaterial.js";
import { LineGeometry } from "../../build/lines/LineGeometry.js";
import { initializeWhenLoaded } from "./useSceneSetup.js";
import {
  selectedJoint,
  scaleX,
  scaleY,
  setSelectedJoint,
  // mouseJointHover,
  // setMouseJointHover,
  setSelectedValue,
  bonesList,
  playPressed,
  setPlayPressed,
  baseScene,
  toolTipVisibility,
  setToolTipVisibility,
} from "./store.js";

class SkeletonViewer {
  constructor(scene, color_joints) {
    this.scene = scene; // Shared scene from BaseScene
    this.color_joints = color_joints;
    this.mixer = null;
    this.action = null;
    this.globalResult = null;
    this.animationClip = null;

    this.sphereMeshes = new THREE.Group();
    this.lineMeshes = new THREE.Group();
    this.newParent = new THREE.Group();

    this.boneNames = [];
    this.boneHierarchy = [];
    this.jointIndex = null;
    this.positions = new Float32Array([1, 1, 1, 1, 1, 1]);

    this.matLine = new LineMaterial({
      color: 0x000000,
      linewidth: 1,
      worldUnits: true,
    });

    this.startPosition = new THREE.Vector3();
    this.endPosition = new THREE.Vector3();

    this.newPosition = new THREE.Vector3(0, 0, 0);
    this.label = null;
    this.plotLabel = null;
  }

  loadSkeleton(bvhFile) {
    const loader = new BVHLoader();

    loader.load(bvhFile, (result) => {
      // const skeletonHelper = new THREE.SkeletonHelper(
      // 	result.skeleton.bones[0]
      // )
      // this.addListeners()

      this.globalResult = result; // Store the result for use within other methods

      this.animationClip = result.clip; // Storing the clip in the global scope for later use

      const fps = 90; // Define the frames per second
      const framesToCut = 5;
      const timeToCut = framesToCut / fps;
      // Example usage:
      this.cutFirstFrames(result.clip, timeToCut);
      this.setupMixer(result); // Setup the animation mixer with the modified result

      const frameNumber = 1; // Initial frame
      const timeInSeconds = frameNumber / fps; // Convert frame number to seconds
      this.mixer.setTime(timeInSeconds); // Set the mixer time

      // // Add skeleton bones and helper to the shared scene
      // this.scene.add(result.skeleton.bones[0])
      // this.scene.add(skeletonHelper)

      // // Create animation mixer and play the animation
      // this.mixer = new THREE.AnimationMixer(result.skeleton.bones[0])
      // this.mixer.clipAction(result.clip).play()

      setTimeout(() => {
        this.createSphereMeshes(); // Create visual representations for bones
        this.createBoneMeshes(); // Optionally create visual representations for bone connections

        //this.animate(); // Start the animation loop
      }, 1000); // Delay to ensure everything is set up properly

      setTimeout(() => {
        this.reCenter(); // Start the animation loop
      }, 1000); // Delay to ensure everything is set up properly
    });
  }

  // Setup the animation mixer
  async setupMixer(result) {
    this.mixer = new THREE.AnimationMixer(result.skeleton.bones[0]); // Create an animation mixer
    this.action = this.mixer.clipAction(result.clip); // Get the action from the clip
    this.action.play(); // Play the action
    this.action.clampWhenFinished = false;
  }

  cutFirstFrames(clip, timeToCut) {
    clip.tracks.forEach((track) => {
      // Filter out keyframes that are within the time to cut
      let times = track.times;
      let values = track.values;
      let stride = values.length / times.length;

      let startIndex = times.findIndex((time) => time >= timeToCut);
      if (startIndex === -1) {
        // No keyframes after the cut time
        startIndex = times.length;
      }

      track.times = times.slice(startIndex).map((time) => time - timeToCut);
      track.values = values.slice(startIndex * stride);
    });

    // Adjust the duration of the clip
    clip.duration -= timeToCut;
  }

  // Utility method for creating sphere meshes, assuming you're visualizing joints or similar
  async createSphereMeshes() {
    let geometry;
    // this.scene.add(this.sphereMeshes) // Add the group to the scene

    // Helper function to calculate depth
    function calculateDepth(bone) {
      let depth = 0;
      let currentBone = bone;
      while (currentBone.parent && currentBone.parent.type !== "Scene") {
        currentBone = currentBone.parent;
        depth++;
      }
      return depth;
    }

    function endsWithNumber(str) {
      return /\d+$/.test(str);
    }

    function endsWithEnd(str) {
      return /end$/.test(str);
    }

    // await this.globalResult.skeleton.bones.forEach((bone, index, array) => {
    // 	const depth = calculateDepth(bone) // Calculate the depth based on parent chain
    // 	if (bone.name === "ENDSITE" && index > 0) {
    // 		const previousBoneName = array[index - 1].name
    // 		bone.name = `${previousBoneName}_end`
    // 	}

    // 	if (
    // 		bone.name === "LeftFootToe_end" ||
    // 		bone.name === "RightFootToe_end"
    // 	) {
    // 		geometry = new THREE.SphereGeometry(0, 32, 32)
    // 	} else if (depth >= 9) {
    // 		geometry = new THREE.SphereGeometry(1.2, 32, 32)
    // 	} else {
    // 		geometry = new THREE.SphereGeometry(3, 32, 32)
    // 	}

    // 	const material = new THREE.MeshBasicMaterial({ color: 0x145e9f })
    // 	const sphere = new THREE.Mesh(geometry, material)

    // 	sphere.name = bone.name
    // 	bone.getWorldPosition(sphere.position)

    // 	this.sphereMeshes.add(sphere)
    // 	this.boneNames.push(bone.name)
    // 	if (!bone.name.endsWith("end")) {
    // 		this.boneHierarchy.push({ name: bone.name, depth: depth }) // Add the bone and its depth to the hierarchy list
    // 	}
    // })

    // Περιμένουμε να ολοκληρωθούν όλες οι προσθήκες σφαιρών
    await Promise.all(
      this.globalResult.skeleton.bones.map(async (bone, index, array) => {
        const depth = calculateDepth(bone);

        if (bone.name === "ENDSITE" && index > 0) {
          const previousBoneName = array[index - 1].name;
          bone.name = `${previousBoneName}_end`;
        }

        if (
          bone.name === "LeftFootToe_end" ||
          bone.name === "RightFootToe_end"
        ) {
          geometry = new THREE.SphereGeometry(0, 32, 32);
        } else if (depth >= 9) {
          geometry = new THREE.SphereGeometry(1.2, 32, 32);
          // } else if (
          // 	endsWithNumber(bone.name) ||
          // 	endsWithEnd(bone.name)
          // ) {
          geometry = new THREE.SphereGeometry(1.2, 32, 32);
        } else {
          geometry = new THREE.SphereGeometry(3, 32, 32);
        }

        const material = new THREE.MeshBasicMaterial({
          color: this.color_joints,
        });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.name = bone.name;
        bone.getWorldPosition(sphere.position);

        this.sphereMeshes.add(sphere);
        this.boneNames.push(bone.name);
        if (!bone.name.endsWith("end")) {
          this.boneHierarchy.push({ name: bone.name, depth: depth });
        }
      })
    );

    // Creating a map of bone names to their indices for quick lookup
    this.jointIndex = this.boneNames.reduce((acc, bone, index) => {
      acc[bone] = index;
      return acc;
    }, {});

    this.boneIndex = this.boneNames.reduce((acc, bone, index) => {
      // Check if the bone name ends with '_end'
      if (bone.endsWith("_end")) {
        return acc; // Skip this bone and do not increment the index for the next bone
      }

      acc[bone] = acc.hasOwnProperty("lastIndex")
        ? acc["lastIndex"] + 1
        : index; // Use lastIndex if it exists, otherwise use the current index
      acc["lastIndex"] = acc[bone]; // Update lastIndex to the current bone's index
      return acc;
    }, {});

    // Clean up the auxiliary property once indexing is complete
    delete this.boneIndex["lastIndex"];

    await new Promise((resolve) => setTimeout(resolve, 50)); // Μικρή καθυστέρηση

    this.sphereMeshes.children[
      this.jointIndex[selectedJoint()]
    ].material.color.set("red"); // Set specific joint color to red
  }

  createBoneMeshes() {
    // this.scene.add(this.lineMeshes)

    this.globalResult.skeleton.bones.forEach((bone) => {
      const lineGeometry = new LineGeometry();
      // Assuming positions is a property of myScene, like this.positions
      lineGeometry.setPositions(this.positions);

      const lineMesh = new Line2(lineGeometry, this.matLine);
      lineMesh.frustumCulled = false;

      lineMesh.computeLineDistances();
      lineMesh.scale.set(1, 1, 1);
      this.matLine.linewidth = 2;

      if (bone.parent) {
        bone.getWorldPosition(this.startPosition);
        bone.parent.getWorldPosition(this.endPosition);
        this.positions.set(
          [
            this.startPosition.x,
            this.startPosition.y,
            this.startPosition.z,
            this.endPosition.x,
            this.endPosition.y,
            this.endPosition.z,
          ],
          0
        );

        if (bone.name === "Hips") {
          lineMesh.visible = false;
        }
        if (bone.name === "Spine") {
          lineMesh.visible = false;
        }

        lineMesh.geometry.setPositions(this.positions);
        this.lineMeshes.add(lineMesh);
      }
    });
  }

  updateSpherePositions() {
    this.globalResult.skeleton.bones.forEach((bone, index) => {
      if (this.sphereMeshes.children[index]) {
        bone.getWorldPosition(this.sphereMeshes.children[index].position);
      }
    });
  }

  updateLinePositions() {
    this.globalResult.skeleton.bones.forEach((bone, index) => {
      //console.log(bone, index);
      if (bone.parent && this.lineMeshes.children[index]) {
        bone.getWorldPosition(this.startPosition);
        bone.parent.getWorldPosition(this.endPosition);

        const line = this.lineMeshes.children[index];
        if (line && line.geometry instanceof LineGeometry) {
          line.geometry.attributes.instanceStart.setXYZ(
            0,
            this.startPosition.x,
            this.startPosition.y,
            this.startPosition.z
          );
          line.geometry.attributes.instanceEnd.setXYZ(
            0,
            this.endPosition.x,
            this.endPosition.y,
            this.endPosition.z
          );
          line.geometry.attributes.instanceStart.needsUpdate = true;
          line.geometry.attributes.instanceEnd.needsUpdate = true;
        } else {
          console.error(
            "LineGeometry or lineMesh not found or invalid for index:",
            index
          );
        }
      }
    });
  }

  reCenter() {
    this.globalResult.skeleton.bones[0].scale.set(0.5, 0.5, 0.5);
    this.mixer.timeScale = 0;
    this.mixer.setTime(0); // Set the time in the mixer to update the skeleton state

    // this.globalResult.skeleton.bones[0].getWorldPosition(this.newPosition) // Get the new position
    let minDistance = Infinity;
    let closestBone = null;

    // this.newPosition.y -= 200 // Adjust Y position

    this.globalResult.skeleton.bones.forEach((bone) => {
      let boneWorldPosition = new THREE.Vector3();
      bone.getWorldPosition(boneWorldPosition);
      let distance = Math.abs(boneWorldPosition.y - this.newPosition.y);
      if (distance < minDistance) {
        minDistance = distance;
        closestBone = bone;
      }
    });
    // console.log("minDistance: ", minDistance)
    // console.log("closestBone: ", closestBone)

    this.displacement = new THREE.Vector3().subVectors(
      this.newPosition,
      this.globalResult.skeleton.bones[0].position
    ); // Calculate displacement
    this.displacement.y += minDistance; // Adjust Y position

    // console.log("displacement: ", this.displacement)
    // console.log("sphereMeshes: ", this.sphereMeshes.children[0])

    this.sphereMeshes.position.add(this.displacement);
    this.lineMeshes.position.add(this.displacement);

    // Retrieve the child mesh by name
    const childMesh = this.sphereMeshes.getObjectByName(closestBone.name);
    // console.log("childnameLlllll", childMesh)

    if (childMesh) {
      // Create vectors for positions
      const worldPositionSphere = new THREE.Vector3();
      const worldPositionBone = new THREE.Vector3();
      const origin = new THREE.Vector3(0, 0, 0);

      // Get the world position of the childMesh (the sphere) and closestBone
      closestBone.getWorldPosition(worldPositionBone);
      childMesh.getWorldPosition(worldPositionSphere);

      // Compute the distance between the sphere and the origin (0, 0, 0) on the y-axis
      const distanceToOriginY = worldPositionSphere.y - origin.y;

      // Compute the distance between the sphere and the closestBone on the y-axis
      const distanceToBoneY = worldPositionSphere.y - worldPositionBone.y;

      // You can add or subtract these distances based on your need
      const totalDistanceY = -distanceToOriginY + distanceToBoneY / 2;
      // const totalDistanceY = -distanceToOriginY  ( incase you want scale=1) !!!!!!

      // Log the results for y-axis distances
      // console.log(
      // 	"Distance from sphere to origin (y-axis):",
      // 	distanceToOriginY
      // )
      // console.log(
      // 	"Distance from sphere to closestBone (y-axis):",
      // 	distanceToBoneY
      // )
      // console.log("Total Distance (y-axis, addition):", totalDistanceY)

      // If you want to move the sphereMeshes based on this total distance for the y-axis
      this.sphereMeshes.position.add(new THREE.Vector3(0, totalDistanceY, 0));

      this.lineMeshes.position.add(new THREE.Vector3(0, totalDistanceY, 0));

      // 1. Create a new parent group
      // const newParent = new THREE.Group()

      // 4. Add sphereMeshes to the new parent
      this.newParent.add(this.sphereMeshes);
      this.newParent.add(this.lineMeshes);

      // 6. Replace sphereMeshes in the scene with the new parent
      this.scene.add(this.newParent);

      // // 1. Παίρνουμε το root bone (Hips)
      // const rootBone = this.globalResult.skeleton.bones[0]

      // // 3. Παίρνουμε το τοπικό rotation του Hips (Euler γωνίες)
      // const localRotationHips = rootBone.rotation.clone()

      // // 4. Υπολογίζουμε την αντίστροφη περιστροφή (δηλαδή, αφαιρούμε τη rotation του Hips)
      // const correctedRotation = new THREE.Euler(
      // 	0,
      // 	-localRotationHips.y,
      // 	0
      // )

      // // 5. Εφαρμόζουμε αυτή τη διαφορά στις σφαίρες
      // newParent.rotation.copy(correctedRotation)

      // 1. Get the root bone (Hips)
      const rootBone = this.globalResult.skeleton.bones[0];

      // 2. Get the local rotation of Hips (Euler angles)
      const localRotationHips = rootBone.rotation.clone();

      // 3. Compute the actual forward direction of Hips
      const hipsDirection = new THREE.Vector3(0, 0, -1); // Default forward (-Z)
      hipsDirection.applyEuler(localRotationHips); // Apply the current Hips rotation

      // 4. Compute the correct Y rotation to align it with the standard forward (-Z)
      const angleY = Math.atan2(hipsDirection.x, hipsDirection.z); // Compute rotation angle

      // 5. Apply the corrected rotation
      const correctedRotation = new THREE.Euler(0, -angleY, 0);
      this.newParent.rotation.copy(correctedRotation);

      // console.log(
      // 	"✅ Local rotation of Hips applied to sphereMeshes without position shifting."
      // )

      // console.log(
      // 	"hips rotation before: ",

      // 	this.globalResult.skeleton.bones[10].rotation
      // )
      // console.log(
      // 	"hips rotation after: ",
      // 	this.sphereMeshes.children[10].rotation
      // )
      // console.log("hips rotation after: ", this.sphereMeshes.children[10])
    }
  }

  getTimeSeries(jointName = "RightArm") {
    const baseIndex = this.boneIndex[selectedJoint()] * 2; // Since each bone has two tracks
    const index = this.jointIndex[selectedJoint()];

    // console.log("uploadedFile selected Joint ", selectedJoint())
    // console.log("uploadedFile selected Joint Index ", index)

    let skeleton = this.globalResult.skeleton; // Adjust the access based on how you store the skeleton
    // console.log(skeleton)
    let bone = skeleton.bones[index];

    if (!bone) {
      console.error("Bone not found:");
      return [];
    }

    let jointAnimationClip = this.animationClip;
    //let positionTrack = jointAnimationClip.tracks[index];
    let rotationTrack = jointAnimationClip.tracks[baseIndex + 1]; // Quaternion rotation track index

    // console.log(
    // 	"Selected Bone: ",
    // 	selectedJoint(),
    // 	"    ",
    // 	rotationTrack,
    // 	bone
    // )
    if (!rotationTrack) {
      console.error("No position track found at index", index);
      return [];
    }

    let positionsX = [];
    let positionsY = [];
    let positionsZ = [];
    let positions = [];

    let anglesX = [],
      anglesY = [],
      anglesZ = [];

    let speed = [];
    let accelerations = [];
    const offset = new THREE.Vector3();

    for (let i = 0; i < rotationTrack.times.length; i++) {
      let time = rotationTrack.times[i];
      this.mixer.setTime(time); // Set the time in the mixer to update the skeleton state
      this.mixer.update(1 / 90); // Update the mixer state

      // Compute the world coordinates
      bone.updateMatrixWorld(true);
      bone.updateMatrix();

      // Υπολόγισε world positions
      const boneWorldPos = new THREE.Vector3();
      bone.getWorldPosition(boneWorldPos);

      const sphereWorldPos = new THREE.Vector3();
      this.sphereMeshes.children[index].getWorldPosition(sphereWorldPos);

      if (i === 0) {
        // Υπολόγισε την αρχική μετατόπιση από τη σφαίρα προς το bone
        offset.subVectors(sphereWorldPos, boneWorldPos);
      }

      // Υπολόγισε τη νέα θέση του bone με βάση τη σφαίρα + offset
      const worldPosition = boneWorldPos.clone().add(offset);

      // positionsX.push(worldPosition.x)
      // positionsY.push(worldPosition.y)
      // positionsZ.push(worldPosition.z)
      // positions.push(worldPosition.clone())

      positionsX.push(boneWorldPos.x);
      positionsY.push(boneWorldPos.y);
      positionsZ.push(boneWorldPos.z);
      positions.push(boneWorldPos.clone());

      let euler = bone.rotation;

      anglesX.push(THREE.MathUtils.radToDeg(euler.x));
      anglesY.push(THREE.MathUtils.radToDeg(euler.y));
      anglesZ.push(THREE.MathUtils.radToDeg(euler.z));

      // anglesX.push(euler.x)
      // anglesY.push(euler.y)
      // anglesZ.push(euler.z)

      // Compute speed (scalar velocity magnitude)
      if (i > 0) {
        let dt = rotationTrack.times[i] - rotationTrack.times[i - 1];
        let velocity = positions[i].distanceTo(positions[i - 1]) / dt; // Speed = distance / time
        speed.push(velocity);

        // Compute acceleration (scalar)
        if (i > 1) {
          let acceleration = (speed[i - 1] - speed[i - 2]) / dt;
          accelerations.push(acceleration);
        } else {
          accelerations.push(0); // No acceleration for the first step
        }
      } else {
        speed.push(0); // No speed for the first frame
        accelerations.push(0); // No acceleration for the first frame
      }
    }

    return [
      positionsX,
      positionsY,
      positionsZ,
      anglesX,
      anglesY,
      anglesZ,
      speed,
      accelerations,
    ];
  }

  getAllTimeSeries() {
    let skeleton = this.globalResult.skeleton; // The skeleton containing all bones
    let jointAnimations = {}; // Object to store time series data for each joint

    // Iterate through all joints (bones) in the skeleton
    skeleton.bones.forEach((bone, jointIndex) => {
      let jointName = bone.name;
      let baseIndex = this.boneIndex[jointName] * 2; // Each bone has two tracks (position & rotation)
      let rotationTrack = this.animationClip.tracks[baseIndex + 1]; // Access the quaternion rotation track

      if (!rotationTrack) {
        console.warn(`No rotation track found for joint: ${jointName}`);
        return;
      }

      let positions = [],
        positionsX = [],
        positionsY = [],
        positionsZ = [];
      let anglesX = [],
        anglesY = [],
        anglesZ = [];
      let speed = [],
        accelerations = [];

      // Iterate over all frames in the animation track
      for (let i = 0; i < rotationTrack.times.length; i++) {
        let time = rotationTrack.times[i];
        this.mixer.setTime(time); // Set the animation time
        this.mixer.update(1 / 90); // Update the mixer to refresh the skeleton state

        // Update the bone transformation matrices
        bone.updateMatrixWorld(true);
        bone.updateMatrix();

        let worldPosition = new THREE.Vector3();
        bone.getWorldPosition(worldPosition); // Get the world position of the joint

        // Store joint positions
        positionsX.push(worldPosition.x);
        positionsY.push(worldPosition.y);
        positionsZ.push(worldPosition.z);
        positions.push(worldPosition.clone());

        // Extract Euler angles from the bone's rotation
        let euler = bone.rotation;
        anglesX.push(THREE.MathUtils.radToDeg(euler.x)); // Convert radians to degrees
        anglesY.push(THREE.MathUtils.radToDeg(euler.y));
        anglesZ.push(THREE.MathUtils.radToDeg(euler.z));

        // Compute speed (velocity magnitude)
        if (i > 0) {
          let dt = rotationTrack.times[i] - rotationTrack.times[i - 1]; // Time difference between frames
          let velocity = positions[i].distanceTo(positions[i - 1]) / dt; // Speed = distance / time
          speed.push(velocity);

          // Compute acceleration (change in speed)
          if (i > 1) {
            let acceleration = (speed[i - 1] - speed[i - 2]) / dt;
            accelerations.push(acceleration);
          } else {
            accelerations.push(0); // No acceleration for the first valid frame
          }
        } else {
          speed.push(0); // No speed for the first frame
          accelerations.push(0); // No acceleration for the first frame
        }
      }

      // Store the computed time series for this joint
      jointAnimations[jointName] = {
        positionsX,
        positionsY,
        positionsZ,
        anglesX,
        anglesY,
        anglesZ,
        speed,
        accelerations,
      };
    });

    return jointAnimations; // Return all joint time series data
  }

  // Compute various gesture metrics in meters (all input assumed to be in centimeters)
  getGestureMetrics(selectedJoints = ["RightHand", "LeftHand"]) {
    const jointTimeSeries = this.getAllTimeSeries();
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    let selectedMovement = 0;
    let totalBodyMovement = 0;
    let totalSelectedSpeed = 0;
    let totalBodySpeed = 0;
    const totalDuration = this.getAnimationDuration();

    const allJoints = Object.keys(jointTimeSeries);
    const numFrames = jointTimeSeries[allJoints[0]].positionsX.length;

    const centroid = {};
    let maxDiff = 0;
    let totalPostureVariation = 0;

    // Step 1: Compute the average posture (centroid) for each joint
    for (const joint of allJoints) {
      const { positionsX, positionsY, positionsZ } = jointTimeSeries[joint];

      centroid[joint] = {
        x: positionsX.reduce((sum, val) => sum + val, 0) / positionsX.length,
        y: positionsY.reduce((sum, val) => sum + val, 0) / positionsY.length,
        z: positionsZ.reduce((sum, val) => sum + val, 0) / positionsZ.length,
      };
    }

    // Step 2: Iterate through all joints and compute metrics
    for (const joint of allJoints) {
      const { positionsX, positionsY, positionsZ } = jointTimeSeries[joint];

      // Update bounding box for Gesture Volume (GV)
      min.x = Math.min(min.x, ...positionsX);
      min.y = Math.min(min.y, ...positionsY);
      min.z = Math.min(min.z, ...positionsZ);

      max.x = Math.max(max.x, ...positionsX);
      max.y = Math.max(max.y, ...positionsY);
      max.z = Math.max(max.z, ...positionsZ);

      let movement = 0;
      let speed = 0;

      for (let i = 1; i < positionsX.length; i++) {
        // Δ movement between frames
        const dx = positionsX[i] - positionsX[i - 1];
        const dy = positionsY[i] - positionsY[i - 1];
        const dz = positionsZ[i] - positionsZ[i - 1];

        // Convert distance from cm to meters
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) / 100;
        movement += distance;

        const dt = i; // assuming uniform time step
        speed += distance / dt;

        // Distance from current joint to its centroid (for BPV)
        const dxC = positionsX[i] - centroid[joint].x;
        const dyC = positionsY[i] - centroid[joint].y;
        const dzC = positionsZ[i] - centroid[joint].z;

        const deviation = Math.sqrt(dxC * dxC + dyC * dyC + dzC * dzC) / 100;
        totalPostureVariation += deviation;

        // Compare current frame with all previous frames for BPD
        for (let k = 0; k < i; k++) {
          const dxK = positionsX[i] - positionsX[k];
          const dyK = positionsY[i] - positionsY[k];
          const dzK = positionsZ[i] - positionsZ[k];

          const diff = Math.sqrt(dxK * dxK + dyK * dyK + dzK * dzK) / 100;
          maxDiff = Math.max(maxDiff, diff);
        }
      }

      totalBodyMovement += movement;
      totalBodySpeed += speed;

      if (selectedJoints.includes(joint)) {
        selectedMovement += movement;
        totalSelectedSpeed += speed;
      }
    }

    // Compute Gesture Volume (GV) in m³ (was cm³ originally)
    const gestureVolume =
      ((max.x - min.x) * (max.y - min.y) * (max.z - min.z)) / 1_000_000;

    const ratioOfMovement =
      totalBodyMovement > 0 ? selectedMovement / totalBodyMovement : 0;
    const performanceTime = totalDuration;

    const avgGestureSpeed =
      performanceTime > 0 ? totalBodyMovement / performanceTime : 0;
    const avgHandsSpeed =
      performanceTime > 0 ? selectedMovement / performanceTime : 0;

    // Body Posture Variation (average deviation from centroid)
    const bodyPostureVariation = totalPostureVariation / numFrames;

    // Body Posture Diffusion (maximum inter-posture distance)
    const bodyPostureDiffusion = maxDiff;

    // Body Posture Density (variation per unit volume)
    const bodyPostureDensity =
      gestureVolume > 0 ? bodyPostureVariation / gestureVolume : 0;

    // Body Posture Rate (variation over time)
    const bodyPostureRate =
      performanceTime > 0 ? bodyPostureVariation / performanceTime : 0;

    return {
      GV: gestureVolume,
      QM: totalBodyMovement, // Movement of all joints

      QMHands: selectedMovement, // Movement of selected joints (e.g., hands)
      RM: ratioOfMovement,
      T: performanceTime,
      S_total: avgGestureSpeed, // Average speed of all joints
      SHands: avgHandsSpeed, // Average speed of selected joints
      BPV: bodyPostureVariation,
      BPD: bodyPostureDiffusion,
      BPp: bodyPostureDensity,
      BPR: bodyPostureRate,
    };
  }

  async createDataframes() {
    const variablesOpt = [
      "Spine",
      "Spine1",
      "Spine2",
      "Spine3",
      "Hips",
      "Neck",
      "Head",
      "LeftArm",
      "LeftForeArm",
      "RightArm",
      "RightForeArm",
      "LeftShoulder",
      "LeftShoulder2",
      "RightShoulder",
      "RightShoulder2",
      "LeftUpLeg",
      "LeftLeg",
      "RightUpLeg",
      "RightLeg",
    ];

    let finalAnglesArray = [];
    let finalWoldPosArray = [];

    variablesOpt.forEach((jointName) => {
      // console.log(jointName)
      const index = this.jointIndex[jointName];
      let skeleton = this.globalResult.skeleton;
      let bone = skeleton.bones[index];

      if (!bone) {
        console.error("Bone not found:", jointName);
        return;
      }

      let jointAnimationClip = this.animationClip;
      const baseIndex = this.boneIndex[jointName] * 2;
      let rotationTrack = jointAnimationClip.tracks[baseIndex + 1];

      if (!rotationTrack) {
        console.error("No rotation track found for", jointName);
        return;
      }

      let anglesX = [];
      let anglesY = [];
      let anglesZ = [];

      let positionsX = [];
      let positionsY = [];
      let positionsZ = [];
      this.mixer.timeScale = 1;

      for (let i = 0; i < rotationTrack.times.length; i++) {
        let time = rotationTrack.times[i];
        this.mixer.setTime(time);
        this.mixer.update(1 / 90);

        bone.updateMatrixWorld(true);
        bone.updateMatrix();
        let worldPosition = new THREE.Vector3();
        bone.getWorldPosition(worldPosition);

        positionsX.push(worldPosition.x);
        positionsY.push(worldPosition.y);
        positionsZ.push(worldPosition.z);

        let euler = bone.rotation;

        anglesX.push(THREE.MathUtils.radToDeg(euler.x));
        anglesY.push(THREE.MathUtils.radToDeg(euler.y));
        anglesZ.push(THREE.MathUtils.radToDeg(euler.z));
      }

      for (let j = 0; j < anglesX.length; j++) {
        if (!finalAnglesArray[j]) {
          finalAnglesArray[j] = [];
        }
        if (!finalWoldPosArray[j]) {
          finalWoldPosArray[j] = [];
        }
        finalAnglesArray[j].push(anglesX[j], anglesY[j], anglesZ[j]);
        finalWoldPosArray[j].push(positionsX[j], positionsY[j], positionsZ[j]);
      }
    });

    return [finalAnglesArray];
  }
  async addListeners() {
    document.addEventListener("mousemove", (event) => this.onMouseMove(event));

    document.addEventListener("click", (event) => {
      let valueSelected = "";

      if (this.mouseJointHover !== null) {
        bonesList().forEach((bone) => {
          if (bone.endsWith(this.mouseJointHover[1])) {
            valueSelected = bone;
          }
        });
        // console.log("yo: ", this.mouseJointHover, valueSelected)

        setSelectedValue(valueSelected);
        this.sphereMeshes.children[
          this.jointIndex[selectedJoint()]
        ].material.color.set(this.color_joints);
        setSelectedJoint(this.mouseJointHover[1]);
        this.sphereMeshes.children[
          this.jointIndex[selectedJoint()]
        ].material.color.set("red");

        initializeWhenLoaded();
      }
    });
  }

  // Handle mouse move events to update mesh colors and show tooltip
  onMouseMove(event) {
    function styleWords(str, style) {
      return str
        .split(" ")
        .map((word) => `<span style="${style}">${word}</span>`)
        .join(" ");
    }
    const pointer = new THREE.Vector2();

    var rect = baseScene().renderer.domElement.getBoundingClientRect();
    pointer.x =
      ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
    pointer.y =
      -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(pointer, baseScene().camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(this.sphereMeshes.children);

    // console.log("intersects: ", intersects)

    event.preventDefault();

    const idx = this.jointIndex[selectedJoint()];
    // console.log("idx: ", idx)
    this.sphereMeshes.children[idx].material.color.set("red"); // Reset mesh color to green

    const tooltip = document.getElementById("tooltip");
    let tooltipVisible = false;
    tooltip.style.display = "block";
    // console.log(window.screen.width);
    this.mouseJointHover = null;

    // intersects[0].object.material.color.set(0x145e9f) // Reset mesh color to blue

    this.sphereMeshes.children.forEach((mesh, index) => {
      if (index !== this.jointIndex[selectedJoint()]) {
        mesh.material.color.set(this.color_joints);
      }
      if (intersects.length !== 0) {
        const exists = bonesList().some((bone) =>
          bone.includes(intersects[0].object.name)
        );
        if (intersects[0].object.name === mesh.name) {
          // Check if mouse is close to a mesh

          if (!exists) {
            mesh.material.color.set(0x104a7e); // Reset mesh color to blue
          } else if (index === this.jointIndex[selectedJoint()]) {
            mesh.material.color.set(0xb30000); // Reset mesh color to red
          } else {
            mesh.material.color.set(0x00ff00); // Change mesh color to green
          }
          const worldPos = new THREE.Vector3();
          mesh.getWorldPosition(worldPos);
          tooltip.innerHTML = `<div style="text-align: left; font-weight: 450;">Name: ${
            styleWords(
              this.boneNames[index],
              // intersects[0].object.name,

              "color: black; font-weight: 550;"
            ) // Example style
          }</div>
			<div style="font-weight: 450;">
					
				<div style="margin-top: 8px; margin-bottom: 4px;">Original Position (BVH local):</div>
					X: ${styleWords(mesh.position.x.toFixed(2), "color: red;")}, 
					Y: ${styleWords(mesh.position.y.toFixed(2), "color: green;")}, 
					Z: ${styleWords(mesh.position.z.toFixed(2), "color: blue;")}

  				<div style="margin-top: 8px; margin-bottom: 4px;">World Position (after alignment):</div>
					X: ${styleWords(worldPos.x.toFixed(2), "color: red;")}, 
					Y: ${styleWords(worldPos.y.toFixed(2), "color: green;")}, 
					Z: ${styleWords(worldPos.z.toFixed(2), "color: blue;")}
					</div>
							`;
          tooltip.style.left = `${(event.clientX + 15) / scaleX()}px`;
          tooltip.style.top = `${(event.clientY + 15) / scaleX()}px`;
          tooltip.style.visibility = "visible";
          tooltipVisible = true;
          if (exists) {
            this.mouseJointHover = [bonesList()[index], this.boneNames[index]];
          }
        }
      }
    });

    setToolTipVisibility((prev) => {
      const newVisibility = [...prev]; // Δημιουργία αντιγράφου του array
      newVisibility[this.label - 1] = tooltipVisible; // Τροποποίηση της πρώτης θέσης
      return newVisibility; // Επιστροφή του νέου array
    });

    const allFalse = toolTipVisibility().every((value) => value === false);

    if (allFalse) {
      tooltip.style.visibility = "hidden";
    }
  }

  update(delta) {
    // Update mixer (if there is an animation running)
    if (this.mixer) {
      this.mixer.update(delta);
    }

    try {
      this.updateSpherePositions();
      this.updateLinePositions();
    } catch (error) {
      // Handle any error that occurred during skeleton loading
      console.error("Failed to load skeleton:", error);
    }
  }

  setAnimationTime(timeInSeconds) {
    if (this.mixer) {
      if (this.mixer.timeScale === 1) {
        this.mixer.setTime(timeInSeconds);
      }

      if (this.mixer.timeScale === 0) {
        this.mixer.timeScale = 1;

        this.mixer.setTime(timeInSeconds);
        this.mixer.timeScale = 0;
      }
      // this.sphereMeshes.rotation.set(0, timeInSeconds * 10, 0) // Περιστροφή 90° στον X άξονα
    }
  }

  getAnimationDuration() {
    return this.mixer && this.action && this.action.getClip()
      ? this.action.getClip().duration
      : 0;
  }

  play() {
    setPlayPressed(true);
    if (this.mixer) {
      this.mixer.timeScale = 1;
      this.action.paused = false;
    }
    // console.log("mixer: ", this.mixer)
  }

  stop() {
    setPlayPressed(false);

    if (this.mixer) {
      this.mixer.timeScale = 0;
    }
  }
}

export default SkeletonViewer;
