function displayTable() {
    firebase.database().ref("applications").once("value").then(function(snapshot) {
        for(var key in snapshot.val()) {
            addAppToTable(key);
        }
    });
};

displayTable();

var addButton = document.getElementById("addButton");
var addModal = document.getElementById("addModal");
var closeAddModal = document.getElementById("closeAddModal");
var submitAddModal = document.getElementById("submitAddModal");
var editModal = document.getElementById("editModal");
var submitEditModal = document.getElementById("submitEditModal");
var closeEditModal = document.getElementById("closeEditModal");
var deleteAppButton = document.getElementById("deleteAppButton");
var editingID;

addButton.onclick = function() {
    addModal.style.display = "block";
};

var response = document.getElementById("addResponse");
var offer = document.getElementById("addOffer");
if(response.value === "noResponse") {
    offer.value = "noOffer";
    offer.disabled = true;
}
response.onchange = onResponseChanged;


function onResponseChanged() {
    var response = document.getElementById("addResponse");
    var offer = document.getElementById("addOffer");
    if(response.value === "rejected" || response.value === "noResponse") {
        offer.value = "noOffer";
        offer.disabled = true;
    } else {
        offer.disabled = false;
    }
}

closeAddModal.onclick = function() {
    addModal.style.display = "none";
};

closeEditModal.onclick = function() {
    editModal.style.display = "none";
}

submitAddModal.onclick = function() {
    var appID = generateID();
    var companyName = document.getElementById("addCompanyName");
    var jobTitle = document.getElementById("addJobTitle");
    var dateApplied = document.getElementById("addDateApplied");
    var response = document.getElementById("addResponse");
    var offer = document.getElementById("addOffer")

    addAppToDatabase(appID, companyName.value, jobTitle.value, dateApplied.value, response.value, offer.value);
    addAppToTable(appID);
};

submitEditModal.onclick = function() {
    var companyName = document.getElementById("editCompanyName").value;
    var jobTitle = document.getElementById("editJobTitle").value;
    var dateApplied = document.getElementById("editDateApplied").value;
    var response = document.getElementById("editResponse").value;
    var offer = document.getElementById("editOffer").value;

    firebase.database().ref("/applications/" + editingID).update({
        "companyName": companyName,
        "jobTitle": jobTitle,
        "dateApplied": dateApplied,
        "response": response,
        "offer": offer
    });

    clearTable();
    displayTable();
    editModal.style.display = "none";
}

deleteAppButton.onclick = function() {
    firebase.database().ref("/applications/" + editingID).remove();
    clearTable();
    displayTable();
    editModal.style.display = "none";
}

function addAppToDatabase(appID, companyName, jobTitle, dateApplied, response, offer) {
    firebase.database().ref("/applications/" + appID).set({
        "appID": appID,
        "companyName": companyName,
        "jobTitle": jobTitle,
        "dateApplied": dateApplied,
        "response": response,
        "offer": offer
    });
}

function addAppToTable(appID) {
    firebase.database().ref("/applications/" + appID).once("value").then(function(snapshot) {
        var appsTable = document.getElementById("appsTable");
        var newApp = appsTable.insertRow(appsTable.length);

        var companyName = newApp.insertCell(0);
        companyName.innerHTML = snapshot.val().companyName;

        var jobTitle = newApp.insertCell(1);
        jobTitle.innerHTML = snapshot.val().jobTitle;

        var dateApplied = newApp.insertCell(2);
        dateApplied.innerHTML = snapshot.val().dateApplied;

        var response = newApp.insertCell(3);
        var responseValue = snapshot.val().response;
        if(responseValue === "noResponse") {
            response.innerHTML = "No Response";
        } else if(responseValue === "responded") {
            response.innerHTML = "Responded";
        } else if(responseValue === "rejected") {
            response.innerHTML = "Rejected";
        }

        var offer = newApp.insertCell(4);
        var offerValue = snapshot.val().offer;
        if(offerValue === "yesOffer") {
            offer.innerHTML = "Yes";
        } else if(offerValue === "noOffer") {
            offer.innerHTML = "No";
        }

        if(responseValue === "responded" && offerValue === "yesOffer") {
            offer.classList.add("responded");
        } else if(responseValue === "noResponse") {
            offer.classList.add("noResponse");
        } else if((responseValue === "responded" || responseValue ==="rejected") && offerValue === "noOffer") {
            offer.classList.add("rejected");
        }

        var edit = newApp.insertCell(5);
        edit.innerHTML = "<button id=\"" + appID + "\">Edit</button>";
        document.getElementById(appID).onclick = onEditClicked;
    });
};

function generateID() {
    var date = new Date();
    return date.getTime();
}

function onEditClicked() {
    editingID = this.id;
    editModal.style.display = "block";

    firebase.database().ref("/applications/" + this.id).once("value").then(function(snapshot) {
        document.getElementById("editCompanyName").setAttribute("value", snapshot.val().companyName);
        document.getElementById("editJobTitle").setAttribute("value", snapshot.val().jobTitle);
        document.getElementById("editDateApplied").setAttribute("value", snapshot.val().dateApplied);
        
        var response = document.getElementById("editResponse")
        for(var i, j = 0; i = response.options[j]; j++) {
            if(i.value == snapshot.val().response) {
                response.selectedIndex = j;
                break;
            }
        }

        var offer = document.getElementById("editOffer")
        for(var i, j = 0; i = offer.options[j]; j++) {
            if(i.value == snapshot.val().offer) {
                offer.selectedIndex = j;
                break;
            }
        }
    });
}

function clearTable() {
    var apps = document.getElementsByTagName("tbody")[0];
    while (apps.firstChild) {
        apps.removeChild(apps.lastChild);
    }
}