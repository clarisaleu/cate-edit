/* global AFRAME, Croquet, Q */

import RootModel from "./model/RootModel.js";
import RootView from "./view/RootView.js";

// grab the main A-Frame scene
const scene = AFRAME.scenes[0];
if (scene) {
  // Because modules load after the document/scene loads, we can't register the system/component in this file
  // instead wait for the scene to load before creating the session
  // otherwise the registered "croquet" system won't receive the emitted "createcroquetsession" event containing the Model/View
  const onSceneLoaded = () => {
    console.log("A-Frame scene has loaded");
    scene.emit("createcroquetsession", { RootModel, RootView });
  };

  console.log("Waiting for A-Frame scene to load...");
  if (scene.hasLoaded) {
    onSceneLoaded();
  } else {
    scene.addEventListener("loaded", event => onSceneLoaded(), { once: true });
  }
} else {
  console.warn("A-Frame scene not found in document");
}
