// npm start = starting application
const { app, BrowserWindow, dialog, systemPreferences, ipcMain } = require('electron');
const socket = require("socket.io-client")("http://localhost:3000");
let request = require("request");
let fs = require("fs");
let decompressZip = require("decompress-zip");
let child = require("child_process").execFile;
let editJsonFile = require("edit-json-file");

let folderPath;
let button;
let win;
let downloadFolder;
let extractPath;
let exeFile = "C:\\TestDownload\\WFP/wut.exe";
let installFolder;
let updateNum;
let updateAvelible = false;
let instalPath;

app.on('ready', createWindow);

socket.on("connect", function() {
    console.log("Connected to socket");
    socket.emit("ApplicationUpade");
    
    socket.on("SendBackInfo", (data) => {
        console.log("Got msg back from server: " + data);
            updateNum = data;
    })
    
});

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600, resizable: false});// frame: false 
  // and load the index.html of the app.
  win.loadFile('index.html');
  // Open the DevTools.
  //win.webContents.openDevTools()
    
}

ipcMain.on("buttonClick", function(e) {
    console.log("Opening folder dialog");
    folderPath = dialog.showOpenDialog({
      properties: ["openFile",
                   "openDirectory",
                   "multiSelections"]
  }, selectedFiles => selectFolder(selectedFiles, e));
});

ipcMain.on("StartDownload", function(e) {
    let file = editJsonFile("storage/storage.json");
    let isInstalled = file.get("isInstalled");
    if (isInstalled == false) {
        console.log("Opening folder dialog");
        folderPath = dialog.showOpenDialog({
            properties: ["openFile",
                         "openDirectory",
                         "multiSelections"]
        }, selectedFiles => selectFolder(selectedFiles, e));
    }else if (updateAvelible == false) {
        //TO DO: launch application
        console.log("Launch");
        launchApplication(e);
    }else {
       let file = editJsonFile("storage/storage.json");
       instalPath = file.get("installFolder");
       console.log("Starting update");
       downloadUpdate("http://localhost:3000/static/updates/updateV001.zip", instalPath + "/Blank/Content/Paks/updateV001.zip", e);
    }
});

ipcMain.on("rendererLoaded", (e) => {
    ifappIsInstalled(e);
});


function selectFolder(selectedFiles, e) {
    console.log(selectedFiles);
    try {
        if (selectedFiles[0] != "") {
            let file = editJsonFile("storage/storage.json");
            instalPath = file.get("installFolder");
            //console.log(selectedFiles);
            downloadFolder = selectedFiles[0].replace("\\", "//") + "/test.zip";
            extractPath = selectedFiles[0].replace("\\", "//");
            exeFile = extractPath + "/WFP/wut.exe";
            installFolder = extractPath + "/WFP";
            //console.log(downloadFolder);
            downloadFile("http://localhost:3000/static/test.zip", downloadFolder, e);
        }
    } catch (err) {
        //Catch Statement
        console.log(err.typeError);
        e.sender.send("InstallCanceled");
    }
}

// Download main file
function downloadFile(file_url , targetPath, e){
    // Save variable to know progress
    let received_bytes = 0;
    let total_bytes = 0;

    let req = request({
        method: 'GET',
        uri: file_url
    });

    let out = fs.createWriteStream(targetPath);
    req.pipe(out);

    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
    });

    req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;

        showProgress(received_bytes, total_bytes, e);
    });

    req.on('end', function() {
        console.log("File succesfully downloaded");
        e.sender.send("InstallFinished");
        unsipper(e);
    });
}
//Download update
function downloadUpdate(file_url , targetPath, e){
    // Save variable to know progress
    let received_bytes = 0;
    let total_bytes = 0;

    let req = request({
        method: 'GET',
        uri: file_url
    });

    let out = fs.createWriteStream(targetPath);
    req.pipe(out);

    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
    });

    req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;

        showProgress(received_bytes, total_bytes, e);
    });

    req.on('end', function() {
        console.log("File succesfully downloaded");
        e.sender.send("InstallFinished");
        unsipperUpdate(e);
    });
}

function showProgress(received,total, e){
    var percentage = (received * 100) / total;
    let log = (percentage + "% | " + received + " bytes out of " + total + " bytes.");
    e.sender.send("updateLoadBar", percentage);
}

// unzip a zip file
function unsipper(e) {
    let Zip_File_Path = downloadFolder;
    let DESTINATION_PATH = extractPath;
    let Unzipper = new decompressZip(Zip_File_Path);
    
    Unzipper.on("error", (err) => {
        console.log(err);
    });
    
    // Notify when everything is extracted
    Unzipper.on('extract', function (log) {
        console.log('Finished extracting', log);
        e.sender.send("finishedExtracting");
        deleteZipfile();
        setApplicationInstalled();
    });

    // Notify "progress" of the decompressed files
    Unzipper.on('progress', function (fileIndex, fileCount) {
        //console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
        let infoObj = {
            index: fileIndex + 1,
            count: fileCount
        }
        //console.log(infoObj);
        e.sender.send("updateEctraction", infoObj);
    });

    // Start extraction of the content
    Unzipper.extract({
    path: DESTINATION_PATH
        // You can filter the files that you want to unpack using the filter option
        //filter: function (file) {
            //console.log(file);
            //return file.type !== "SymbolicLink";
        //}
    });  
}

function unsipperUpdate(e) {
    let file = editJsonFile("storage/storage.json");
    instalPath = file.get("installFolder");
    
    let Zip_File_Path = instalPath + "/Blank/Content/Paks/updateV001.zip";
    let DESTINATION_PATH = instalPath + "/Blank/Content/Paks/";
    let Unzipper = new decompressZip(Zip_File_Path);
    
    Unzipper.on("error", (err) => {
        console.log(err);
    });
    
    // Notify when everything is extracted
    Unzipper.on('extract', function (log) {
        console.log('Finished extracting', log);
        e.sender.send("finishedExtracting");
        deleteUpdateZipfile();
        setApplicationInstalled();
        updateAvelible = false;
        file.set("updateVersion", updateNum);
        file.save();
    });

    // Notify "progress" of the decompressed files
    Unzipper.on('progress', function (fileIndex, fileCount) {
        //console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
        let infoObj = {
            index: fileIndex + 1,
            count: fileCount
        }
        //console.log(infoObj);
        e.sender.send("updateEctraction", infoObj);
    });

    // Start extraction of the content
    Unzipper.extract({
    path: DESTINATION_PATH
        // You can filter the files that you want to unpack using the filter option
        //filter: function (file) {
            //console.log(file);
            //return file.type !== "SymbolicLink";
        //}
    });  
}

function launchApplication(e) {
    child(exeFile, function(err, data) {
      if(err){
         console.error(err);
         return;
      }
       //console.log(data.toString());
        console.log("Closed exe file");
        e.sender.send("closedExternalApp");
    });
}

function deleteZipfile() {
    fs.unlink(downloadFolder, () => {
        console.log("Deleted Zip file");
    })
}

function deleteUpdateZipfile() {
    let file = editJsonFile("storage/storage.json");
    instalPath = file.get("installFolder");
    fs.unlink(instalPath + "/Blank/Content/Paks/updateV001.zip", () => {
        console.log("Deleted Zip file");
    })
}

function ifappIsInstalled(send) {
    let file = editJsonFile("storage/storage.json");
    let isInstalled = file.get("isInstalled");
    let updateVersion = file.get("updateVersion");
    let instalPath = file.get("installFolder");
        if (fs.existsSync(instalPath) == true) {
            if (isInstalled == true) {
                send.sender.send("exeIsInstalled");
            }

            if (updateVersion < updateNum) {
                send.sender.send("updateAvelible");
                updateAvelible = true;
            }else {
                console.log("The app is up to date and exists");
                updateAvelible = false;
            }
        }else {
            console.log("Application is not installed");
            file.set("isInstalled", false);
            file.set("updateVersion", "000");
            file.save();
        }
    
}

function setApplicationInstalled() {
    let file = editJsonFile("storage/storage.json");
    file.set("isInstalled", true);
    file.set("installFolder", installFolder);
    file.save();
    installed = true;
}

























