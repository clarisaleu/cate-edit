/* global Croquet, AFRAME, THREE, label */

/* Displays a visual representation of another user that the current user can interact with */
class UserView extends Croquet.View {
  /* Creates a new UserView with the given model */
  constructor(model) {
    super(model);
    this.model = model;
    
    // Get the scene so we can add entities to it.
    this.scene = AFRAME.scenes[0];
    
    // Find which user this view represents 
    if (this.isCurUser) {
      console.log("Current user ID: " + this.viewId);
      
      this.publishCameraMatrix = AFRAME.utils.throttle(
        () => {
          // instead of just publishing the camera matrix, we check if the camera matrix has changed since we last updated the model matrix
          // in the model we also decompose the matrix to position/quaternion/scale, so rather than compare matrix elements we could check position difference and quaternion angle for more fine-tuned conditions
          
          // only publish camera matrix if it moved
          const hasCameraMovedSinceLastModelMatrixUpdate = this.camera.matrixWorld.elements.every((value, index) => value === this.model.matrix.elements[index]);
          if (!hasCameraMovedSinceLastModelMatrixUpdate) {
            // label.setAttribute('value', 'Publishing at time ' + this.now());
            this.publish(this.viewId, "update-matrix", this.camera.matrixWorld.elements);
          }
        },
        1000 / 24,
        this
      );
    } else {
      this.entity = document
        .getElementById("userTemplate")
        .content.cloneNode(true)
        .querySelector(".user");
      //this.head = this.entity.querySelector(".head")
      //this.head.setAttribute("color", this.color);
      //this.subscribe(this.userViewId, "update-color", this.updateColor);
      //this.lastTimeMatrixWasUpdated = 0;
      //this.log("Remote User Entity Created", this.entity)
      //this.addEventListener(this.head, "componentchanged", this.onHeadComponentChanged);
      // this.entity.addEventListener(
      //   "loaded",
      //   event => {
      //     this.log("Remote User Entity loaded", this.entity);
      //     // We want to manually update the matrix in our "update" method
      //     this.entity.object3D.matrixAutoUpdate = false;
      //   },
      //   { once: true }
      // );
      
      //this.log("Adding remote user entity to the scene");
      //this.scene.appendChild(this.entity);
      
      
      console.log("Other user's ID: " + this.viewId);
      // Make a user entity
      //this.entity = document.createElement('a-sphere');
      //this.entity.setAttribute('material', 'color: blue');
      //this.entity.setAttribute('radius', '0.05');
      //this.entity.setAttribute('visible', 'false');
      //this.entity.setAttribute('class', 'user');
      //this.entity.setAttribute('dynamic-body', {});

      //const parentEntity = this.scene.querySelector("#parent-entity-player");
      //console.log("In UserView - Parent Entity : ", parentEntity);
      //this.entity.setAttribute('position', {
      //   x: 0,
      //   y: 2,
      //   z: 1
      // });
      //var sceneEl = document.querySelector("a-scene");
      //var html = "<a-entity movement-controls> <a-entity id=\"player\" wasd-controls look-controls networked=\"template:#userTemplate;attachTemplateToLocal:false;\" camera position=\"0 1.1 0\"></a-entity> <a-sphere class=\"user\" visible=\"false\" random-color></a-sphere> <a-entity id=\"rhand\" mixin=\"touch\" hand-controls=\"hand: right\"> </a-entity><a-entity id=\"lhand\" mixin=\"touch\" hand-controls=\"hand: left\"></a-entity>";
      
      //sceneEl.innerHTML += html;
      
      this.entity.addEventListener(
        "loaded",
        event => {
          console.log("Remote User Entity loaded", this.entity);
          // We want to manually update the matrix in our "update" method
          this.entity.object3D.matrixAutoUpdate = false;
        },
        { once: true }
      );
      
      console.log("Adding remote user entity to the scene");
      this.lastMatrixUpdateTime = 0;
      this.scene.appendChild(this.entity);
      //parentEntity.appendChild(this.entity);
    }
  }
  
  /* Check to see if this view represents the current user or
   * a different user.
   */
  get isCurUser() {
    return this.model.userViewId === this.viewId;
  }
  
  /* Gets the scene's camera */
  get camera() {
    return this.scene.camera;
  }
  
  /* Gets this user's matrix */
  get matrix() {
    return this.model.matrix;
  }
  
  /* Gets the last time the model's matrix was set */
  get lastMatrixSetTime() {
    return this.model.lastMatrixSetTime;
  }
  
  /* Called periodically */
  update() {
    if (this.isCurUser) {
      this.publishCameraMatrix();
    } else {
      // Update the matrix if we need to
      if (this.entity && this.entity.hasLoaded) {
        if (this.lastMatrixSetTime > this.lastMatrixUpdateTime) {
          // The model has updated the matrix but we haven't
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
        }
        // Update the matrix based on physics
        let derivedMatrix = new THREE.Matrix4();
        let derivedQuaternion = new THREE.Quaternion(this.entity.body.quaternion.x, this.entity.body.quaternion.y, this.entity.body.quaternion.z, this.entity.body.quaternion.w);
        derivedMatrix.compose(this.entity.body.position, derivedQuaternion, this.model.scale);
        this.entity.object3D.matrix.copy(derivedMatrix);
        this.entity.object3D.matrixWorldNeedsUpdate = true;

        this.lastMatrixUpdateTime = this.lastMatrixSetTime;
        // this.entity.setAttribute("position", "1 1 1");
        // console.log(this.entity.body)
      }
    }
    
    // In this scheme, we control the x and z axis by moving around, but the physics
    // engine controls the y axis (up and down movement)
  }
  
  /* Called when the view detaches */
  detach() {
    super.detach();
    
    if (!this.isCurUser && this.entity) {
      // We have an entity, so we should go remove it.
      this.entity.remove();
    }
    
    console.log('Detached');
  }
}

export default UserView;