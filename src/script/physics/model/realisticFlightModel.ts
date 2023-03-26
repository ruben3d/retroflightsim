/**
 * WIP
 */

import * as THREE from 'three';
import { FlightModel } from './flightModel';

export class RealisticFlightModel extends FlightModel {

    //private gravity: THREE.Vector3 = new THREE.Vector3(0, 9.8, 0); // m/s^2
    //private dryMass: number = 20000; // kg

    step(delta: number): void {
        /*
       
       This needs part by part modeling and rigid body physics
       
       
                       // Roll control
                       if (!isZero(this.roll)) {
                           this.obj.rotateZ(-this.roll * ROLL_RATE * delta);
                       }
               
                       // Pitch control
                       if (!isZero(this.pitch)) {
                           this.obj.rotateX(this.pitch * PITCH_RATE * delta);
                       }
               
                       // Yaw control
                       if (!isZero(this.yaw)) {
                           this.obj.rotateY(-this.yaw * YAW_RATE * delta);
                       }
                       
                               // // Automatic yaw when rolling
                               // const forward = this.obj.getWorldDirection(this._v);
                               // if (-0.99 < forward.y && forward.y < 0.99) {
                               //     const prjForward = forward.setY(0);
                               //     const up = this._w.copy(UP).applyQuaternion(this.obj.quaternion);
                               //     const prjUp = up.projectOnPlane(prjForward).setY(0);
                               //     const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? 1 : -1;
                               //     this.obj.rotateOnWorldAxis(UP, sign * prjUp.length() * prjUp.length() * prjForward.length() * 2.0 * YAW_RATE * delta);
                               // }
                       
                               // // Movement
                               // this.speed = this.throttle * MAX_SPEED;
                               // this.obj.translateZ(-this.speed * delta);
                   
               
               
                       const gravity = 9.8; // m/s^2
                       const maxThrust = 11.6; // m/s^2
                       const dryMass: number = 20000; // kg
                       const wingArea: number = 78; // m^2
                       const airDensity: number = 1.0;
                       const Cdf: number = 0.08; // Unitless
               
                       let lift: THREE.Vector3 = new THREE.Vector3(); // N
                       let drag: THREE.Vector3 = new THREE.Vector3(); // N
                       let thrust: THREE.Vector3 = new THREE.Vector3(); // N
                       let weight: THREE.Vector3 = new THREE.Vector3(); // N
               
                       const computeLiftInducedDrag = (aoa: number) => 1 - Math.cos(2.0 * aoa);
                       const computeLift = (aoa: number) => aoa < (Math.PI / 8.0) || aoa > (7 * Math.PI / 8.0) ? Math.sin(6.0 * aoa) : Math.sin(2.0 * aoa);
               
                       this.obj.updateMatrixWorld();
                       console.log('las', this._v.copy(this.velocity).applyQuaternion(this.obj.getWorldQuaternion(this._Q).invert()));
                       console.log('lasn', this._v.setX(0).normalize());
                       console.log('fwd', FORWARD);
                       const aoa = this._v.angleTo(FORWARD) * Math.sign(-this._v.y);
                       // const aoa = this.obj.worldToLocal(this._v.copy(this.airSpeed)).setX(0).normalize().angleTo(FORWARD);
                       console.log('aoa', aoa);
                       //const aoa = Math.PI / 12.0;
               
                       //! WEIGHT
                       roundToZero(weight.set(0, -gravity, 0).multiplyScalar(dryMass));
                       console.log('W', this._v.copy(weight).divideScalar(dryMass));
               
                       //! THRUST
                       roundToZero(thrust.copy(UP).applyQuaternion(this.obj.quaternion).negate().multiplyScalar(airDensity * maxThrust * this.throttle * dryMass));
                       console.log('T', this._v.copy(thrust).divideScalar(dryMass));
               
                       //! DRAG
                       const Cd = Cdf + computeLiftInducedDrag(aoa);
                       roundToZero(drag.copy(this.velocity).negate().normalize().multiplyScalar(0.5 * Cd * airDensity * this.velocity.lengthSq() * wingArea));
                       console.log('D', this._v.copy(drag).divideScalar(dryMass));
               
                       //! LIFT
                       const Cl = computeLift(aoa);
                       roundToZero(lift.copy(UP).applyQuaternion(this.obj.quaternion).multiplyScalar(0.5 * Cl * airDensity * this.velocity.lengthSq() * wingArea));
                       console.log('L', this._v.copy(lift).divideScalar(dryMass));
               
                       //! Timestep
                       const accel = this._v.set(0, 0, 0).add(thrust).add(drag).add(lift).add(weight).divideScalar(dryMass);
                       this.velocity.addScaledVector(roundToZero(accel), delta);
                       console.log('accel', accel);
                       this.obj.position.addScaledVector(roundToZero(this.velocity), delta);
                       console.log('as', this.velocity);
               
                       console.log('---');
               
                       /////////////////////////////////////////////////////////////////
               
                       // Avoid ground crashes
                       if (this.obj.position.y < PLANE_DISTANCE_TO_GROUND) {
                           this.obj.position.y = PLANE_DISTANCE_TO_GROUND;
                           const d = this.obj.getWorldDirection(this._v);
                           if (d.y > 0.0) {
                               d.setY(0).add(this.obj.position);
                               this.obj.lookAt(d);
                           }
                           //! 
                           this.velocity.setY(0);
                       }
               
                       // Avoid flying too high
                       if (this.obj.position.y > MAX_ALTITUDE) {
                           this.obj.position.y = MAX_ALTITUDE;
                           //! 
                           this.velocity.setY(0);
                       }
               
                       // Avoid flying out of bounds, wraps around
                       const terrainHalfSize = 2.5 * TERRAIN_SCALE * TERRAIN_MODEL_SIZE;
                       if (this.obj.position.x > terrainHalfSize) this.obj.position.x = -terrainHalfSize;
                       if (this.obj.position.x < -terrainHalfSize) this.obj.position.x = terrainHalfSize;
                       if (this.obj.position.z > terrainHalfSize) this.obj.position.z = -terrainHalfSize;
                       if (this.obj.position.z < -terrainHalfSize) this.obj.position.z = terrainHalfSize;
               */
    }

    getStallStatus(): number {
        return 0;
    }
}