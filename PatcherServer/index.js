// node index.js = starting server

console.log("Server is starting");

let express = require("express");
let app = express();
let server = app.listen(3000);
let path = require("path");
let fs = require("fs");
let editJsonFile = require("edit-json-file");

app.use('/static', express.static(path.join(__dirname, 'public')));

let updateFolderPath = "public/updates/";



console.log("Listening on port 3000");

let socket = require("socket.io");

let io = socket(server);

io.sockets.on("connection", (socket) => {
    console.log(socket.id);
    socket.on("ApplicationUpade", (e) => {
        console.log("Got msg from electron");
        let file = editJsonFile("manifest/pushOutManifest.json");
        let updateVersion = file.get("updateVersion");
        socket.emit("SendBackInfo", updateVersion);
        console.log("sendt version num: " + updateVersion + " to clients");
    });
    
    socket.on("hello", (e) => {
        getUpdateFiles();
    })
});

function getUpdateFiles() {
    let file = editJsonFile("manifest/pushOutManifest.json");
    let updateVersion = file.get("updateVersion");
    let howManyFiles = 0;
    
    fs.readdir(updateFolderPath, function(err, items) {
    console.log(items);

    for (let i = 0; i < items.length; i++) {
        console.log(items[i]);
        howManyFiles++;
    }
  });
    
    file.set("updateVersion", howManyFiles + 1);
    file.save();
}









