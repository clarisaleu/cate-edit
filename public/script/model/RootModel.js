/* global Croquet */

import UserModel from "./UserModel.js";
import ObjectModel from "./ObjectModel.js";

/* This is the "root" model that is created when the page loads.
 * All other models are created and stored here.
 */
class RootModel extends Croquet.Model {
  init(options) {
    super.init();

    this.userModels = [];
    this.objectModels = [];
    this.objectIds = ["obj", "box1", "box2", "cylin1", "cylin2"]; // ids of objects

    // Listen for when someone joined or exited.
    this.subscribe(this.sessionId, "view-join", this.onViewJoin);
    this.subscribe(this.sessionId, "view-exit", this.onViewExit);

    // Create object models based on ids.
    console.log("size of object models in rootmodel: " + this.objectIds.length);
    for (var i = 0; i < this.objectIds.length; i++){
      if (!this.objectModels.find(objectModel => objectModel.objectViewId === this.objectIds[i])) {
        // Haven't created model for object yet -
        console.log("Created Model in RootModel with ID: " + this.objectIds[i]);
        this.objectModels.push(ObjectModel.create({ objectViewId: this.objectIds[i] }))
      }
    }
    
    
    console.log("In RootModel - object models are: " , this.objectModels);
    // this.objectIds.forEach(objViewId =>
    //   this.objectModels.push(ObjectModel.create({ objectViewId: objViewId }))
    // );
  }

  /* Called when a view joined */
  onViewJoin(userViewId) {
    const userModel = UserModel.create({
      userViewId: userViewId
    });
    this.userModels.push(userModel);

    this.publish("users", "did-join", userViewId);
    this.publish(userViewId, "did-join");
  }

  /* Called when a view exited */
  onViewExit(userViewId) {
    const userModel = this.findUserModelById(userViewId);
    if (userModel) {
      // There's a model for the given index, so we should remove it
      const index = this.userModels.indexOf(userModel);
      this.userModels.splice(index, 1);
      userModel.destroy();

      this.publish("users", "did-exit", userViewId);
    }

    // If we don't have any more user views left, clean up.
    if (this.userModels.length === 0) {
      // Clean up any leftover ObjectModels.
      this.objectModels.forEach(objectModel => objectModel.destroy());
    }
  }

  /* Utility functions for finding UserModels */
  findUserModelById(userViewId) {
    return this.userModels.find(
      userModel => userModel.userViewId === userViewId
    );
  }
}

RootModel.register("RootModel");

export default RootModel;
