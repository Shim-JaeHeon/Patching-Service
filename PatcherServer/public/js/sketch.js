



let chooseButton = document.getElementById("chooseFolderButton");
let inputFileLabel = document.getElementById("inputFile");
let updateReadyButton = document.getElementById("submittButton");

let socket = io.connect("http://localhost:3000");


updateReadyButton.addEventListener("click", (e) => {
    socket.emit("hello");
});










































