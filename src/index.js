const os = require('os');
const  fs = require('fs');
const { ipcRenderer } = require('electron');

let userData = {};
let table = [];
let excludedDays = [0, 3, 6];

function timer(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function sortArrayByTime(array) {
    array.sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));
}

window.addEventListener('load', event => {
    const filePath = os.tmpdir() + "/zoomlinks.fucku"
    fs.mkdir(filePath, { recursive: true }, (err) => { if (err) throw err; });
    fs.access(filePath + "/user_data.json", fs.F_OK, async err => {
        if (err) {
            let JSONformattedShit = { aspenData: {}, zoomData: [], autoJoin: true };
            fs.writeFileSync(filePath + "/user_data.json", JSON.stringify(JSONformattedShit), err => {
                if (err) throw err;
            });
        }

        await readJSONFile();
        buildTable();
    });
});

function readJSONFile(filePath = os.tmpdir() + "/zoomlinks.fucku/user_data.json") {
    console.log("reading json file")
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) throw err;
        
        userData = JSON.parse(data);
        table = userData.zoomData;
        return new Promise(r => r());
    });
}

function writeJSONFile(object, filePath = os.tmpdir() + "/zoomlinks.fucku/user_data.json") {
    fs.writeFileSync(filePath, JSON.stringify(object), err => {
        if (err) throw err;
    });
}

function handleInputForm() {
    let inputTable = { class: "", link: "", time: "00:00", days: [] };
    inputTable.class = document.getElementById("class_name").value;
    inputTable.time = document.getElementById("class_time").value;
    inputTable.link = document.getElementById("class_link").value;
    if (document.getElementById("sunday").checked) inputTable.days.push(0);
    if (document.getElementById("monday").checked) inputTable.days.push(1);
    if (document.getElementById("tuesday").checked) inputTable.days.push(2);
    if (document.getElementById("wednesday").checked) inputTable.days.push(3);
    if (document.getElementById("thursday").checked) inputTable.days.push(4);
    if (document.getElementById("friday").checked) inputTable.days.push(5);
    if (document.getElementById("saturday").checked) inputTable.days.push(6);
    table.push(inputTable);
    userData.zoomData = table;
    writeJSONFile(userData);
    document.getElementById("input_table").innerHTML = '<tr> <td class="itc1" onclick="hideCheckboxes()"><input type="text" id="class_name" placeholder="Meeting Name..." value=""></td> <td class="itc2" onclick="hideCheckboxes()"><input type="time" id="class_time" value=""></td> <td> <div class="multiselect"> <div class="selectBox" onclick="showCheckboxes()"> <select> <option><h3>Days</h3></option> </select> <div class="overSelect"></div> </div> <div id="checkboxes"> <label for="sunday"><input type="checkbox" id="sunday"> Sunday</label> <label for="monday"><input type="checkbox" id="monday"> Monday</label> <label for="tuesday"><input type="checkbox" id="tuesday"> Tuesday</label> <label for="wednesday"><input type="checkbox" id="wednesday"> Wednesday</label> <label for="thursday"><input type="checkbox" id="thursday"> Thursday</label> <label for="friday"><input type="checkbox" id="friday"> Friday</label> <label for="saturday"><input type="checkbox" id="saturday"> Saturday</label> </div> </div> </td> <td class="itc3" onclick="hideCheckboxes()"><input type="text" id="class_link" placeholder="Zoom Link..." value=""></td> <td class="itc4" onclick="hideCheckboxes()"><button onclick="handleInputForm()">Add Meeting</button></td> </tr>';
    buildTable();
}

function handleCheckboxInput() {
    userData.autoJoin = document.getElementById("auto_open").checked;
    writeJSONFile(userData);
}

function arrayOfDaysToString(arr) {
    let daysOfTheWeek = ["S", "M", "Tu", "W", "Th", "F", "Sa"];
    let daysString = "";
    if (arr.length == 7) daysString = "Everyday"
    else {
        for (let i = 0; i < 6; i++) if (arr.includes(i)) daysString += daysOfTheWeek[i] + ", ";
        daysString = daysString.slice(0, -2);
    }

    return daysString;
}

async function buildTable() {
    await timer(50);
    sortArrayByTime(table);
    document.getElementById("auto_open").checked = userData.autoJoin;

    let mainTable = "<tr><th>Meeting</th><th>Days</th><th>Time</th><th>Misc</th></tr>";
    table.forEach(e => {
        mainTable += '<tr><td class="c1">' 
        + e.class + 
        '</td><td class="c2_day">' 
        + arrayOfDaysToString(e.days) +
        '</td><td class="c2">' 
        + e.time + 
        '</td><td class="c3"><button onclick="openZoomLink(\''
        + e.link + 
        '\')">Open</button><button onclick="deleteElement(' + table.indexOf(e) + ')">Delete</button></td></tr>';
    });
    document.getElementById("main_table").innerHTML = mainTable;
    loop();
}

function deleteElement(index) {
    if (index > -1) table.splice(index, 1);
    console.log(table);
    userData.zoomData = table;
    writeJSONFile(userData);
    buildTable();
}

//Handle Checkbox Menu
let expanded = false;
function showCheckboxes() {
  var checkboxes = document.getElementById("checkboxes");
  if (!expanded) {
    checkboxes.style.display = "block";
    expanded = true;
  } else {
    checkboxes.style.display = "none";
    expanded = false;
  }
}

function hideCheckboxes() {
    var checkboxes = document.getElementById("checkboxes");
    checkboxes.style.display = "none";
    expanded = false;
}

function openZoomLink(zoomLink) {
    ipcRenderer.send('load-zoom-link', zoomLink);
    ipcRenderer.on('asynchronous-reply', (event, arg) => console.log(arg));
}

async function loop() {

    if (document.getElementById("auto_open").checked) {
        let d = new Date();
        let currentTime = d.getHours() + ":" + d.getMinutes();
        table.forEach(e => {
            if (e.days.includes(d.getDay())) {
                if (new Date('1970/01/01 ' + currentTime) - new Date('1970/01/01 ' + e.time) == 0) {
                    console.log("the times match!");
                    openZoomLink(e.link);
                } else {
                    console.log(e.class + ": " + currentTime);
                }
            }
        });
    }

    await timer(60000);
    loop();

}