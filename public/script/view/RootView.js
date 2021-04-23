/* global Croquet */

import UserView from "./UserView.js";
import ObjectView from "./ObjectView.js";

/* This is the "root" view that is created when the page loads.
 * All other sub-views (like UserView) are created and stored here.
 */
class RootView extends Croquet.View {
  /* Creates a new RootView and starts subscribing to events */
  constructor(model) {
    super(model);
    this.model = model;

    // Keep track of all the sub-views for each user.
    // this.userViews = new Map(); // Change from original croquet demo, maps from viewIds to UserViews
    this.userViews = [];

    // Keep track of all sub-views for each object.
    this.objectViews = [];
    model.objectModels.forEach(child => this.attachChild(child));
    console.log("In RootView - objectViews are: " + this.objectViews);
    
    if (this.hasJoined) {
      this.onJoin();
    } else {
      console.log("waiting until we've joined...");
      // Listen to when we've joined the session and left the session
      this.subscribe(this.viewId, "did-join", this.onJoin);
    }
  }

  attachChild(child) {
    const objectView = new ObjectView(child);
    this.objectViews.push(objectView);
    console.log("In RootView creating view - objectViewId is: " + child.objectViewId);
  }

  /* Called when we've first joined the session */
  onJoin() {
    console.log("RootModel created a UserModel for us");
    this.model.userModels.forEach(userModel =>
      this.onUserJoin(userModel.userViewId)
    );

    // Now that we've joined the session, start listening for when other users join as well.
    this.subscribe("users", "did-join", this.onUserJoin);
    this.subscribe("users", "did-exit", this.onUserExit);
  }

  /* Called when any user has joined the session */
  onUserJoin(userViewId) {
    // Log that a new user joined
    console.log(
      `User ${userViewId} joined ${userViewId === this.viewId ? "(you)" : ""}`
    );

    // Create a new view for the user and add it to our record of user views
    const userModel = this.model.findUserModelById(userViewId);
    if (userModel) {
      // We've already created a model for this user, so make a view for them.
      const userView = new UserView(userModel);
      this.userViews.push(userView);
      console.log(this.userViews);
      console.log(this.model.userModels);
    }
  }

  /* Called when any user has exited the session */
  onUserExit(userViewId) {
    // Log that a user exited.
    console.log(
      `User ${userViewId} exited ${userViewId === this.viewId ? "(you)" : ""}`
    );

    // Remove the user's view
    console.log(this.userViews);
    const userView = this.findUserViewById(userViewId);
    if (userView) {
      userView.detach();

      const index = this.userViews.indexOf(userView);
      this.userViews.splice(index, 1);
    }
  }

  /* Utility functions for finding UserViews */
  findUserViewById(userViewId) {
    return this.userViews.find(
      userView => userView.model.userViewId === userViewId
    );
  }

  /* Called periodically */
  update() {
    // Call update() on each sub-view
    this.userViews.forEach(userView => userView.update());
    this.objectViews.forEach(objectView => objectView.update());
    //console.log("In RootView - calling update()");
  }

  /* Checks whether we've already joined or not */
  get hasJoined() {
    return this.model.findUserModelById(this.viewId);
  }
  
  /* Called when the user leaves the session */
  detach() {
    super.detach();
    this.userViews.forEach(userView => userView.detach());
    this.objectViews.forEach(objectView => objectView.detach());
  }
}

export default RootView;
