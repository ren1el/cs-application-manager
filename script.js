const COMPANY_CELL_INDEX = 0;
const JOBTITLE_CELL_INDEX = 1;
const DATEAPPLIED_CELL_INDEX = 2;
const RESPONSE_CELL_INDEX = 3;
const OFFER_CELL_INDEX = 4;
const EDIT_BTN_CELL_INDEX = 5;


var ApplicationManager = (function() {
    function generateID() {
        var date = new Date();
        return date.getTime();
    }

    function addApp(companyName, jobTitle, dateApplied, response, offer) {
        var appID = generateID();
        firebase.database().ref("/applications/" + appID).set({
            "appID": appID,
            "companyName": companyName,
            "jobTitle": jobTitle,
            "dateApplied": dateApplied,
            "response": response,
            "offer": offer
        });
        TableManager.updateTable();
    };

    function editApp(appID, companyName, jobTitle, dateApplied, response, offer) {
        firebase.database().ref("/applications/" + appID).update({
            "companyName": companyName,
            "jobTitle": jobTitle,
            "dateApplied": dateApplied,
            "response": response,
            "offer": offer
        });
        TableManager.updateTable();
    }

    function deleteApp(appID) {
        firebase.database().ref("/applications/" + appID).remove();
        TableManager.updateTable();
    }

    function getApplication(appID) {
        var data = firebase.database().ref("/applications/" + appID).once("value").then(function(snapshot) {
            return snapshot.val();
        });
        return data;
    }
    
    return {
        addApp: addApp,
        editApp: editApp,
        deleteApp: deleteApp,
        getApplication: getApplication
    };
})();


var TableManager = (function() {
    // DOM
    var appsTable = document.getElementById("appsTable");

    // run functions
    displayTable();

    function addRow(appID) {
        ApplicationManager.getApplication(appID).then(function(app) {
            var newRow = appsTable.insertRow(appsTable.length);
            addCompanyNameCell(newRow, app.companyName);
            addJobTitleCell(newRow, app.jobTitle);
            addDateAppliedCell(newRow, app.dateApplied);
            addResponseCell(newRow, app.response);
            addOfferCell(newRow, app.offer);
            addEditCell(newRow, app.appID);
            configureOfferColor(newRow, app.response, app.offer);
        });
    };

    function addCompanyNameCell(newRow, companyName) {
        var cell = newRow.insertCell(COMPANY_CELL_INDEX);
        cell.innerHTML = companyName;
    };

    function addJobTitleCell(newRow, jobTitle) {
        var cell = newRow.insertCell(JOBTITLE_CELL_INDEX);
        cell.innerHTML = jobTitle;
    };

    function addDateAppliedCell(newRow, dateApplied) {
        var cell = newRow.insertCell(DATEAPPLIED_CELL_INDEX);
        cell.innerHTML = dateApplied;
    };

    function addResponseCell(newRow, response) {
        var cell = newRow.insertCell(RESPONSE_CELL_INDEX);
        switch(response) {
            case "noResponse":
                cell.innerHTML = "No Response";
                break;
            case "responded":
                cell.innerHTML = "Responded";
                break;
            case "rejected":
                cell.innerHTML = "Rejected"
                break;
            default:
                alert("Error adding a response cell.");
        }
    };

    function addOfferCell(newRow, offer) {
        var cell = newRow.insertCell(OFFER_CELL_INDEX);
        if(offer === "yesOffer") {
            cell.innerHTML = "Yes"
        } else {
            cell.innerHTML = "No"
        }
    };

    function addEditCell(newRow, appID) {
        var cell = newRow.insertCell(EDIT_BTN_CELL_INDEX);
        cell.innerHTML = "<button id=\"" + appID + "\">Edit</button>";
        document.getElementById(appID).onclick = EditModal.displayModal;
    };

    function configureOfferColor(newRow, response, offer) {
        var offerCell = newRow.cells[OFFER_CELL_INDEX];
        if(response === "noResponse") {
            offerCell.classList.add("noResponse");
        } else {
            if(offer === "yesOffer") {
                offerCell.classList.add("responded");
            } else {
                offerCell.classList.add("rejected")
            }
        }
    };

    function updateTable() {
        clearTable();
        displayTable();
    };

    function clearTable() {
        var apps = document.getElementsByTagName("tbody")[0];
        while (apps.firstChild) {
            apps.removeChild(apps.lastChild);
        }
    };

    function displayTable() {
        firebase.database().ref("applications").once("value").then(function(snapshot) {
            for(var key in snapshot.val()) {
                addRow(key);
            }
        });
    };

    return {
        updateTable: updateTable
    };
})();


var AddModal = (function() {
    //DOM
    var addModal = document.getElementById("addModal");
    var addButton = document.getElementById("addButton");
    var closeButton = document.getElementById("closeAddModal");
    var submitButton = document.getElementById("submitAddModal");
    var response = document.getElementById("addResponse");
    var offer = document.getElementById("addOffer");

    //bind events
    addButton.onclick = displayModal;
    closeButton.onclick = closeModal;
    submitButton.onclick = submitApp;
    response.onchange = onResponseChanged;

    //functions
    function displayModal() {
        addModal.style.display = "block";
    }

    function onResponseChanged() {
        if(response.value === "rejected" || response.value === "noResponse") {
            offer.value = "noOffer";
            offer.disabled = true;
        } else {
            offer.disabled = false;
        }
    }

    function closeModal() {
        addModal.style.display = "none";
    }

    function submitApp() {
        var companyName = document.getElementById("addCompanyName").value;
        var jobTitle = document.getElementById("addJobTitle").value;
        var dateApplied = document.getElementById("addDateApplied").value;
        var response = document.getElementById("addResponse").value;
        var offer = document.getElementById("addOffer").value;

        ApplicationManager.addApp(companyName, jobTitle, dateApplied, response, offer);
        closeModal();
    }
})();


var EditModal = (function() {
    //DOM
    var editModal = document.getElementById("editModal");
    var closeButton = document.getElementById("closeEditModal");
    var submitButton = document.getElementById("submitEditModal");
    var deleteButton = document.getElementById("deleteAppButton");
    var response = document.getElementById("editResponse");

    //member variables
    var editingID;

    //bind events
    //note: edit button bindings are found in TableManager addEditCell() method
    closeButton.onclick = closeModal;
    submitButton.onclick = submitEdit;
    deleteButton.onclick = deleteApp;
    response.onchange = setFieldConstraints;

    function displayModal() {
        editingID = this.id;
        editModal.style.display = "block";

        populateFields(editingID);
    }

    function populateFields(appID) {
        ApplicationManager.getApplication(appID).then(function(app) {
            document.getElementById("editCompanyName").setAttribute("value", app.companyName);
            document.getElementById("editJobTitle").setAttribute("value", app.jobTitle);
            document.getElementById("editDateApplied").setAttribute("value", app.dateApplied);
            document.getElementById("editResponse").value = app.response;
            document.getElementById("editOffer").value = app.offer;
            setFieldConstraints();
        });
    }

    function setFieldConstraints() {
        var response = document.getElementById("editResponse");
        var offer = document.getElementById("editOffer");
        if(response.value === "rejected" || response.value === "noResponse") {
            offer.value = "noOffer";
            offer.disabled = true;
        } else {
            offer.disabled = false;
        }
    }

    function closeModal() {
        editModal.style.display = "none";
    }

    function submitEdit() {
        var companyName = document.getElementById("editCompanyName").value;
        var jobTitle = document.getElementById("editJobTitle").value;
        var dateApplied = document.getElementById("editDateApplied").value;
        var response = document.getElementById("editResponse").value;
        var offer = document.getElementById("editOffer").value;

        ApplicationManager.editApp(editingID, companyName, jobTitle, dateApplied, response, offer);
        closeModal();
    }

    function deleteApp() {
        ApplicationManager.deleteApp(editingID);
        closeModal();
    }

    return {
        displayModal: displayModal
    };
})();