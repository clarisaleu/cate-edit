/* global Croquet, THREE */

class ObjectModel extends Croquet.Model {
  init({ objectViewId }) {
    super.init();
    
    this.objectViewId = objectViewId;
    
    // Create a new matrix and decompose it.
    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.scale = new THREE.Vector3();
    this.matrix.decompose(this.position, this.quaternion, this.scale);
    this.lastMatrixSetTime = this.now();
    
    // Listen for incoming matrix updates for certain channel.
    this.subscribe(this.objectViewId, {event: "update-matrix"}, this.updateMatrix);
  }
  
  static types() {
    return {
      "THREE.Matrix4": THREE.Matrix4,
      "THREE.Vector3": THREE.Vector3,
      "THREE.Quaternion": THREE.Quaternion
    };
  }
  

  // Called when the object moves and we need to update the camera matrix
  updateMatrix(matrix) {
    this.matrix.copy(matrix);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
    // update last time matrix was set and update the physics body
    this.lastMatrixSetTime = this.now();
  }
}
ObjectModel.register("Object");

export default ObjectModel;