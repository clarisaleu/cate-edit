/* global Croquet, AFRAME, THREE, label */

/* Displays a visual representation of an object that all users can interact with */
class ObjectView extends Croquet.View {
  /* Creates a new ObjectView with the given model */
  constructor(model) {
    super(model);
    this.model = model;

    // Get the scene so we can add entities to it.
    this.scene = AFRAME.scenes[0];

    // Get entity from scene with ID and assign.
    this.entity = this.scene.querySelector("#" + this.model.objectViewId);

    console.log("Current object ID: " + this.model.objectViewId);
    console.log("In ObjectView - entity is: " + this.entity);

    // Update matrix in update() method.
    //this.entity.object3D.matrixAutoUpdate = false;
    // need this?
    this.entity.addEventListener(
      "loaded",
      event => {
        console.log("Object Entity loaded", this.entity);
        // We want to manually update the matrix in our "update" method
        this.entity.object3D.matrixAutoUpdate = false;
      },
      { once: true }
    );

    this.lastMatrixUpdateTime = 0;

    this.publish3DMatrix = AFRAME.utils.throttle(
      () => {
        // instead of just publishing the matrix, we check if the matrix has changed since we last updated the model matrix
        // in the model we also decompose the matrix to position/quaternion/scale, 
        // so rather than compare matrix elements we could check position difference and quaternion angle for more fine-tuned conditions

        // only publish 3D matrix if it moved
        const has3DMatrixMovedSinceLastModelMatrixUpdate = this.entity.object3D.matrix.elements.every(
          (value, index) => value === this.model.matrix.elements[index]
        );
        if (!has3DMatrixMovedSinceLastModelMatrixUpdate) {
          this.publish(
            this.model.objectViewId,
            "update-matrix",
            this.entity.object3D.matrix
          );
        }
      },
      1000 / 24,
      this
    );

    //this.publish(this.model.objectViewId, "update-matrix", this.entity.object3D.matrix);
  }

  /* Gets this object's matrix */
  get matrix() {
    return this.model.matrix;
  }

  /* Gets the last time the model's matrix was set */
  get lastMatrixSetTime() {
    return this.model.lastMatrixSetTime;
  }

  /* Called periodically */
  update() {
    // TODO: call this.publish3DMatrix();
    
    // Update the matrix if we need to
    if (this.entity && this.entity.hasLoaded) {
      if (this.lastMatrixSetTime > this.lastMatrixUpdateTime) {
        // behind model case
        // The model has updated the matrix but we haven't
        // alert("ObjectView.update(): Updating matrix");
        if (typeof this.lastPosition !== "undefined") {
          // This isn't the first time we've updated the matrix, so calculate the difference
          // and apply an impulse.
          let posDiff = new THREE.Vector3();
          posDiff.copy(this.model.position);
          posDiff.sub(this.lastPosition);
          posDiff.y = 0;
          // this.entity.body.applyLocalImpulse(posDiff, new THREE.Vector3(0, 0, 0));
          this.entity.body.position.set(
            this.entity.body.position.x + posDiff.x,
            this.entity.body.position.y,
            this.entity.body.position.z + posDiff.z
          );
          this.lastPosition.copy(this.model.position);
        } else {
          let derivedPosition = new THREE.Vector3();
          derivedPosition.copy(this.model.position);
          this.lastPosition = new THREE.Vector3();
          this.lastPosition.copy(derivedPosition);
        }
      } else {
        // not behind model - publish
        this.publish3DMatrix();
      }
      // Update the matrix based on physics
      let derivedMatrix = new THREE.Matrix4();
      let derivedQuaternion = new THREE.Quaternion(
        this.entity.body.quaternion.x,
        this.entity.body.quaternion.y,
        this.entity.body.quaternion.z,
        this.entity.body.quaternion.w
      );
      derivedMatrix.compose(
        this.entity.body.position,
        derivedQuaternion,
        this.model.scale
      );
      this.entity.object3D.matrix.copy(derivedMatrix);
      this.entity.object3D.matrixWorldNeedsUpdate = true;

      this.lastMatrixUpdateTime = this.lastMatrixSetTime;
    }
  }

  /* Called when the view detaches - clean up after program/process exits. */
  detach() {
    super.detach();

    if (this.entity) {
      // We have an entity, so we should go remove it.
      this.entity.remove();
    }

    console.log("Detached");
  }
}

export default ObjectView;
