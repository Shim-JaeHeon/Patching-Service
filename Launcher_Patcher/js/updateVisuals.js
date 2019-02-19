//global vars

const electron = require("electron");
let ipcRenderer = require("electron").ipcRenderer;


const button = document.getElementById("openFolderBTN");
//button.addEventListener("click", clickButton);

let updateButton = document.getElementById("updateButton");
let loadingBar = document.getElementById("loadingBar");
let loadingStatus = document.getElementById("loadingStatus");
let barCounter = 0;
let loadBarInterval;

ipcRenderer.on("updateLoadBar", (e, data) => {
    console.log("Getting download data: " + data);
    updateLoadingBar(data);
});

ipcRenderer.on("unlockUpdateButton", (e) => {
  setButtonAble();               
});

ipcRenderer.on("InstallCanceled", (e) => {
    setButtonAble();
});

ipcRenderer.on("InstallFinished", (e) => {
    //On finished download
    updateButton.innerHTML = "Extracting";
    updateButton.style.fontSize = 15 + "px";
});

ipcRenderer.on("updateEctraction", (e, infoObj) => {
    updateExtractionText(infoObj);
});

ipcRenderer.on("finishedExtracting", (e) => {
    setButtonAble();
    updateButton.innerHTML = "Launch";
    loadingStatus.innerHTML = "";
});

ipcRenderer.on("closedExternalApp", (e) => {
   setButtonAble(); 
});

ipcRenderer.on("exeIsInstalled", (e) => {
    isInstalled();
});

ipcRenderer.on("updateAvelible", (e) => {
    updateAvelible();
});

function clickButton(e) {
    e.preventDefault();
    ipcRenderer.send("buttonClick");
}

function updateLoadingBar(data) {
    //console.log(data);
    updateButton.innerHTML = "Downloading";
    updateButton.style.fontSize = 10 + "px";
    let lB = Math.floor(map_range(data, 0, 100, 0, 90)) + "vW";
    loadingBar.style.width = lB;
    //console.log(lB);
    loadingStatus.innerHTML = Math.floor(data) + "%";
}

function updateExtractionText(infoObj) {
    loadingStatus.innerHTML = "Extracting " + infoObj.index + " / " + infoObj.count + " Files";
    loadingStatus.style.left = 250 + "px";
    let lB = map_range(percent(infoObj.index, infoObj.count), 0, 100, 0, 90) + "vW";
    loadingBar.style.width = lB;
}

function triggerLoading() {
    ipcRenderer.send("StartDownload");
    setButtonDisable();
}

function setButtonAble() {
   updateButton.disabled = false;
}

function setButtonDisable() {
    updateButton.disabled = true;
}

function percent(partOf, all) {
    let percent = (partOf * 100) / all;
    return percent;
}

function startUp() {
    ipcRenderer.send("rendererLoaded");
}

function isInstalled() {
    loadingBar.style.width = 90 + "vW";
    loadingStatus.innerHTML = "";
    updateButton.innerHTML = "Launch";
}

function updateAvelible() {
    loadingBar.style.width = 0 + "vW";
    loadingStatus.innerHTML = "";
    updateButton.innerHTML = "Update";
}

// Math Functions
function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

//check startup

startUp();

