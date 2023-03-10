let meetData = {
    events: [],
    participants: [],
}

let club;
let allMeets;
let validClubs = [];
const ENCODING = "ISO-8859-1";


// list available meets from medley.no
function addMeets(meets) {
    allMeets = meets;
    const select = document.getElementById("importMedley");
    for (let i in meets) {
        const meet = meets[i];
        const node = document.createElement("option");
        node.innerText = "[" + meet.startDate.toLocaleDateString() + "] " + meet.organizer + ": " + meet.name;
        node.value = i;
        select.appendChild(node);
    }
}

// Import selected meet
function importMeet(data) {
    const changeMeet = function(data) {
        try {
            const meet = {
                name: getNode(data, "MeetName"),
                events: [],
                participants: [],
            }
            for (let i in data.Events.Event) {
                const evt = data.Events.Event[i];
                const e = {
                    index: parseInt(getNode(evt, "EventNumber")),
                    distance: getNode(evt, "EventLength"),
                    style: getStyle(getNode(evt, "Eventart") || getNode(evt, "EventArt")),
                    gender: getNode(evt, "Sex") == "MALE" ? "M" : (getNode(evt, "Sex") == "FEMALE" ? "K" : "X"),
                }
                meet.events.push(e);
            }
            //Successful import
            meetData = meet;

            $(".personRow, .teamRow, .edit").remove();
            $("#clubSettings").removeClass("hidden");
            $("#meetName").val(meetData.name);

            if (typeof club !== "undefined") {
                showParticipantsTable();
                showImportSection();
                showSummary();
            }

            if (hasIndividualEvents()) {
                openIndividual();
                return;
            }

            if (hasTeamEvents()) {
                openTeam();
                return;
            }

        } catch (e) { console.log(e) };

    }
    if (meetData.participants.length != 0) {
        showModal("confirmationBox",
            document.createTextNode("You have entered participants to the selected meet, are you sure you want to change meet? All unsaved data will be discarded."),
            function() { changeMeet(data); },
            function() {}, { header: "Are you sure you want to change meet?" });
    } else {
        changeMeet(data);
    }
}

function isTeamEvent(evt) {
    if (evt.style == "LM") return true;
    // match (some digit) * (at least two digits)
    if (evt.distance.match(/\d+\*\d{2,}/)) return true;
    return false;
}

function hasTeamEvents() {
    for (let i in meetData.events) {
        const e = meetData.events[i];
        if (isTeamEvent(e)) return true;
    }
    return false;
}

function showSummary() {
    $("#summary").removeClass("hidden");
}

function showImportSection() {
    $("#section-import").removeClass("hidden");
}

function hasIndividualEvents() {
    for (let i in meetData.events) {
        const e = meetData.events[i];
        if (!isTeamEvent(e)) return true;
    }
    return false;
}

function showParticipantsTable() {
    $("#participantsContainer").removeClass("hidden");
}

function disableButton(button) {
    $("#" + button).addClass("disabled");
}

function enableButton(button) {
    $("#" + button).removeClass("disabled");
}

function openIndividual() {
    disableButton("participantIndividualButton");
    showIndividual();
    hideTeam();
    if (hasTeamEvents()) {
        enableButton("participantTeamButton");
        return;
    }
    disableButton("participantTeamButton");
}

function openTeam() {
    disableButton("participantTeamButton");
    showTeam();
    hideIndividual();
    if (hasIndividualEvents()) {
        enableButton("participantIndividualButton");
        return;
    }
    disableButton("participantIndividualButton");
}

function showIndividual() {
    $("#participantSingle").removeClass("hidden");
}

function showTeam() {
    $("#participantTeam").removeClass("hidden");
}

function hideIndividual() {
    $("#participantSingle").addClass("hidden");
}

function hideTeam() {
    $("#participantTeam").addClass("hidden");
}

function getEvent(index) {
    for (let i in meetData.events) {
        const evt = meetData.events[i];
        if (evt.index == index) return evt;
    }
    return false;
}

function hideEditors() {
    const editors = document.getElementsByClassName("edit");
    for (let i = 0; i < editors.length; i++) {
        editors[i].classList.add("hidden");
    }
}
class Teams {
    static teamNumber = new Map();
    static getTeamName(person) {
        const className = person.club + " " + person.gender + " " + person.class + " ";
        try {
            Teams.teamNumber[className] += 1;
        } catch (error) {
            Teams.teamNumber[className] = 1;
        }
        return className + Teams.teamNumber[className];
    }
    static getTeamClass(person) {
        return person.gender[0] + person.class;
    }
}

function createUNIP(meetData) {
    meetData.participants.sort();

    str = club + "\n";
    for (let i in meetData.participants) {
        const person = meetData.participants[i];
        let params = [];

        person.name = sanitizeName(person.name);

        for (let j in person.events) {
            const evt = person.events[j];
            
            // convert time to string with leading zero for integers between 0 and 9
            evt.min = ("00" + (Number(evt.min) || 0)).slice(-2);
            evt.sec = ("00" + (Number(evt.sec) || 0)).slice(-2);
            evt.hun = ("00" + (Number(evt.hun) || 0)).slice(-2);

            const time = `${evt.min}:${evt.sec}.${evt.hun}`;

            if (!isValidBirthYear(person.birthYear)) {
                console.log("[Warning]: " + person.name + "has an invalid birth year.\n birthYear: " + person.birthYear)
            }
            params = [
                // Index
                evt.index,
                // Distance
                getEvent(evt.index).distance,
                // Style
                getEvent(evt.index).style,
                // Name
                person.team ? Teams.getTeamName(person) : person.name.substring(person.name.lastIndexOf(" ") + 1),
                // Surname
                person.team ? Teams.getTeamName(person) : person.name.substring(0, person.name.lastIndexOf(" ")),
                // Empty
                "",
                // Class. teams: {MJR, KJR, XJR, MSR, KSR, XSR}. Individuals: {M01, K02, ...}
                person.team ? Teams.getTeamClass(person) : "" + person.gender + ("" + person.birthYear).substring(2),
                // Birth year for individual class for teams
                person.team ? person.class : person.birthYear,
                // enrollment time
                time,
                // empty *3
                "",
                "",
                "",
                // Short cource: K, long course: L
                "K",
                // empty *3
                "",
                "",
                ""
            ];
            str += params.join(",") + "\n";
        }

    }
    return str;
}
// Find and det correct index for person when gender has been changed
function fixGender(person) { // updateEventIndexes update
    for (let person_event = 0; person_event < person.events.length; person_event++) {
        for (let meet_event = 0; meet_event < meetData.events.length; meet_event++) {

            if (meet_event.gender != person.gender) continue;
            if (meet_event.distance != person_event.distance) continue;
            if (meet_event.style != person_event.style) continue;

            // correct event has been found. Set event index to person
            person_event.index = meet_event.index;
            break;

        }
    }
}

function getE(node, name) {
    return node.querySelectorAll("." + name)[0];
}
// get first element with tag name
function getT(node, tagName) {
    return node.getElementsByTagName(tagName)[0];
}

function setFields(node, value) {
    getT(node, "input").value = value;
}

function colChangeListener(node, func, type) {
    type = type || "input";
    getT(node, type).addEventListener("change", func);
    getT(node, type).addEventListener("keyup", func);
}

// get name of the excersize e.g. 100m freestyle
function getEventString(person) {
    let s = "";
    for (let i = 0; i < person.events.length; i++) {
        const e = person.events[i];
        s += e.distance + "m " + e.style;
        if (i != person.events.length - 1) s += ", ";
    }
    if (s == "") s = "<a href='javascript:void(0)' class='t'>Add events...</a>";
    return s;
}


function initEditor(person, table, span) {
    const t = document.getElementById("eventDummy");

    for (let i in meetData.events) {
        const e = meetData.events[i];
        if (e.gender != "X" && e.gender != person.gender) continue;
        if (isTeamEvent(e) ^ person.team) continue;

        const node = document.importNode(t.content, true);
        const willSwim = getE(node, "willSwim");
        const index = getE(node, "eventId");
        const name = getE(node, "eventName");
        const time = getE(node, "eventTime");

        getT(willSwim, "input").checked = false;
        let personEvent;
        for (let j in person.events) {
            const c = person.events[j];
            if (c.index == e.index) {
                personEvent = c;
                getT(willSwim, "input").checked = true;
            }
        }
        personEvent = personEvent || { index: e.index, distance: e.distance, style: e.style, min: "00", sec: "00", hun: "00" };
        index.innerText = e.index;

        name.innerText = e.distance + "m " + e.style;

        getE(time, "min").value = personEvent.min;
        getE(time, "sec").value = personEvent.sec;
        getE(time, "hun").value = personEvent.hun;

        const addTimeListener = function(name) {
            const func = function() {
                let value = parseInt(getE(time, name).value);
                if (value < 0) value = 0;
                if (value > 59 && name != "hun") value = 59;
                if (value > 99) value = 99;
                value = (value < 10 ? 0 : "") + value;
                getE(time, name).value = value;
                personEvent[name] = value;
                getT(willSwim, "input").checked = true;
                const evt = document.createEvent("HTMLEvents");
                evt.initEvent("change", false, true);
                getT(willSwim, "input").dispatchEvent(evt);
            }
            const next = function() {
                //Both numbers
                if (getE(time, name).value.length == 2) {
                    if (name == "min") getE(time, "sec").focus();
                    if (name == "sec") getE(time, "hun").focus();
                    getE(time, name).blur();
                }
            }
            const focus = function() {
                getE(time, name).select();
            }
            getE(time, name).addEventListener("change", func);
            getE(time, name).addEventListener("keyup", next);
            getE(time, name).addEventListener("focus", focus);

        }


        addTimeListener("min");
        addTimeListener("sec");
        addTimeListener("hun");

        //Add event listeners
        colChangeListener(willSwim, function() {
            let pos;
            for (let k = 0; k < person.events.length; k++) {
                if (personEvent.index == person.events[k].index) pos = k;
            }

            if (getT(willSwim, "input").checked) {
                if (typeof pos == "undefined") person.events.push(personEvent);

            } else {
                if (typeof pos !== "undefined") person.events.splice(pos, 1);
            }

            person.events.sort(function(a, b) { return a.index - b.index; });
            span.innerHTML = getEventString(person);
        });
        span.innerHTML = getEventString(person);

        table.appendChild(node);
    }
}

function nameExists(name) {
    let count = 0;
    for (let i = 0; i < meetData.participants.length; i++) {
        if (name == meetData.participants[i].name) {
            count++;
            if (count > 1) { return true; }
        }
    }
    return false;
}

function nameWritten(sender) {
    if (nameExists(sender.value)) {
        sender.classList.add("warning");
        return;
    }
    sender.classList.remove("warning");
}

function checkYear(sender) {

    if (!isValidBirthYear(sender.value)) {
        sender.classList.add("warning");
        return;
    }
    sender.classList.remove("warning");
}

function appendTeam(team) {
    team = team || {};
    team.name = team.name || "";
    team.gender = team.gender || "M";
    team.class = team.class || "JR";
    team.events = team.events || [];
    team.club = team.club || club;
    team.team = true;

    hideEditors();
    const t = document.getElementById("teamDummy");
    const n = document.importNode(t.content, true);
    const node = n.children[0];

    const name = getE(node, "teamName");
    const cls = getE(node, "teamClass");
    const gender = getE(node, "teamGender");
    const events = getE(node, "teamEvents");

    gender.getElementsByTagName("option")[["M", "K", "X"].indexOf(team.gender)].selected = true;
    cls.getElementsByTagName("option")[["JR", "SR"].indexOf(team.class)].selected = true;

    const suggestName = function() {
        let i = 1;
        for (let p in meetData.participants) {
            const t = meetData.participants[p];
            if (!t.team) continue;
            if (t == team) break;
            if (t.gender != team.gender) continue;
            if (t.class != team.class) continue;
            i++;
        }
        let gender = "Mix";
        if (team.gender == "M") gender = "G";
        if (team.gender == "K") gender = "J";
        team.name = club + " " + gender + i + " " + team.class;
        setFields(name, team.name);
    }

    suggestName();
    colChangeListener(cls, function() {
        team.class = getT(cls, "select").value;
        suggestName();
    }, "select");
    colChangeListener(gender, function() {
        team.gender = getT(gender, "select").value;
        fixGender(team);
        const evs = getE(editor, "eventTable").firstElementChild;
        getE(editor, "eventTable").innerHTML = "";
        getE(editor, "eventTable").appendChild(evs);
        initEditor(team, getE(editor, "eventTable"), events);

        suggestName();
    }, "select");
    colChangeListener(name, function() {
        team.name = getT(name, "input").value;
    });

    const editor = n.children[1];
    initEditor(team, getE(editor, "eventTable"), events);

    node.addEventListener("click", function() {
        hideEditors();
        if (editor.classList.contains("hidden")) editor.classList.remove("hidden");
        else editor.classList.add("hidden");
    });

    meetData.participants.push(team);
    const prev = document.getElementById("teamList").lastChild.lastElementChild;
    document.getElementById("teamList").lastChild.insertBefore(node, prev);
    document.getElementById("teamList").lastChild.insertBefore(editor, prev);

    if (translator) translator.Translate();
}

// Please rewrite me
function appendParticipant(person) {
    // use input or standard
    person = person || {};
    person.name = person.name || "";
    person.gender = person.gender || "M";
    person.birthYear = person.birthYear || new Date().getFullYear() - 14;
    person.events = person.events || [];
    person.club = person.club || club;

    hideEditors();

    // make a copy of template
    const personRow = document.importNode(document.getElementById("participantDummy").content, true).children[0];
    const editor = document.importNode(document.getElementById("participantDummy").content, true).children[1];

    // get DOM objects from the copy
    const name = getE(personRow, "personName");
    const age = getE(personRow, "age");
    const gender = getE(personRow, "gender");
    const events = getE(personRow, "events");

    // Set name, age and gender to the new copy
    setFields(name, person.name);
    setFields(age, person.birthYear);
    gender.getElementsByTagName("option")[person.gender == "M" ? 0 : 1].selected = true;

    // on change update meet participants
    colChangeListener(name, () => { person.name = getT(name, "input").value; });
    colChangeListener(age, () => { person.birthYear = getT(age, "input").value; });
    colChangeListener(gender, () => {
        // get new value from table
        person.gender = getT(gender, "select").value;
        fixGender(person);
        const evs = getE(editor, "eventTable").firstElementChild;
        getE(editor, "eventTable").innerHTML = "";
        getE(editor, "eventTable").appendChild(evs);
        initEditor(person, getE(editor, "eventTable"), events);
    }, "select");

    // editor eventlistener
    personRow.addEventListener("click", function() {
        hideEditors();
        if (editor.classList.contains("hidden")) {
            editor.classList.remove("hidden");
        } else {
            editor.classList.add("hidden");
        }
    });

    initEditor(person, getE(editor, "eventTable"), events);
    meetData.participants.push(person);



    const prev = document.getElementById("participantList").lastChild.lastElementChild;
    document.getElementById("participantList").lastChild.insertBefore(personRow, prev);
    document.getElementById("participantList").lastChild.insertBefore(editor, prev);

    if (translator) translator.Translate();
}

function deleteAthlete(buttonObject) {
    // extract the name
    const name = buttonObject.parentNode.parentNode.children[0].children[0].value;

    // delete the DOM objects
    buttonObject.parentNode.parentNode.nextSibling.remove();
    buttonObject.parentNode.parentNode.remove();

    // delete from meetData
    for (i = 0; i < meetData.participants.length; i++) {
        if (meetData.participants[i].name == name) {
            meetData.participants.splice(i, 1);
            return;
        }
    }
}

// When everyinging is loaded
window.addEventListener("load", function() {

    // load meets from medley server
    if (typeof allMeets == "undefined") {
        const node = document.createElement("option");
        node.value = "invalid";
        node.innerText = "Loading...";
        $("#importMedley").append(node);
        getMedleyList(function(list) {
            addMeets(list);
            node.innerText = "-- Select one --";
        });
    }

    // add event listeners for participant table
    $("#participantIndividualButton").on("click", () => {
        if ($("#participantIndividualButton").hasClass("disabled")) {
            return;
        }
        openIndividual();
    });

    $("#participantTeamButton").on("click", () => {
        if ($("#participantTeamButton").hasClass("disabled")) {
            return;
        }
        openTeam();
    });

    $(".personName input").on("change", (object) => {
        console.log(object);
    });

    // add hover effect to file inputs
    $("#importFile-meetSetup").on("mouseenter", () => {
        $("#importFile-meetSetup").prev().addClass("hover");
    });

    $("#importFile-meetSetup").on("mouseleave", () => {
        $("#importFile-meetSetup").prev().removeClass("hover");
    });

    $("#importFile-tryggivann").on("mouseenter", () => {
        $("#importFile-tryggivann").prev().addClass("hover");
    });

    $("#importFile-tryggivann").on("mouseleave", () => {
        $("#importFile-tryggivann").prev().removeClass("hover");
    });

    $("#importFile-uni_p").on("mouseenter", () => {
        $("#importFile-uni_p").prev().addClass("hover");
    });

    $("#importFile-uni_p").on("mouseleave", () => {
        $("#importFile-uni_p").prev().removeClass("hover");
    });

    // Meet change eventlistener
    $("#importMedley").on("change", () => {
        // validate input
        if ($("#importMedley").val() == "invalid") return;
        if ($("#importMedley option:first").val() == "invalid") {
            $("#importMedley option:first").remove();
        }

        // load meet
        const meet = allMeets[$("#importMedley").val()];
        console.log("Fetching " + meet.url);
        getMedleyMeet(meet.url, function(text) {
            const xml = parseXml(text);
            importMeet(xml.MeetSetUp);
        });

        // open editor if club is already set
        if (typeof club === "undefined") {
            $("#clubName").focus();
            return;
        }
        showParticipantsTable();
        showSummary();
    });

    // Eventlisteners for new athletes / "Add more..." links
    $("#participantList tr:last-child").children().last().on("click", () => { appendParticipant(); });
    $("#teamList tr:last-child").children().last().on("click", () => { appendTeam(); });

    // Make uni_p.txt button
    $("#download").on("click", function() {
        const unip = createUNIP(meetData);
        download(club + " uni_p.txt", unip);
    });

    // Import meet setup from XML
    $("#importFile-meetSetup").on("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // check if the file is a .xml file.
        if (file.name.substring(file.name.length - 4) != ".xml") {
            console.error("Cannot open non .xml files. File open attempt: " + file.name);
            return;
        }

        // parse and import meet
        const reader = new FileReader();
        reader.addEventListener("load", function(e) {
            const xml = parseXml(e.target.result);
            importMeet(xml.MeetSetUp);
        });
        reader.readAsText(file, ENCODING);

        if (typeof club === "undefined") {
            $("#clubName").focus();
        }
    });

    // Import csv file with entries
    $("#importFile-tryggivann").on("change", function(e) {
        // Open file
        const file = e.target.files[0];
        if (!file) return;

        // check if the file is a .csv file.
        if (file.name.substring(file.name.length - 4) != ".csv") {
            console.error("Cannot open non .csv files. File open attempt: " + file.name);
            return;
        }

        // Open a loading modal
        $("#modal-import-csv").modal("show");

        // parse file
        let skippedLines = 0;
        Papa.parse(file, {
            encoding: ENCODING,
            worker: true,

            // for each line do this:
            step: function(results, file) {
                // skip the first 8 lines
                if (skippedLines < 8) {
                    skippedLines++;
                    return;
                }
                // break out of last line
                if (results.data[1] == "Uthevet f??dselsdato betyr bursdag i kursperioden.") {
                    file.abort();
                }

                let person = {};

                // set name
                person.name = sanitizeName(results.data[0])
                if (!person.name) {
                    // no name
                    return;
                }

                // set gender
                results.data[4] == "G" ? person.gender = "M" : person.gender = "K";

                // set birthYear
                person.birthYear = results.data[5].substring(6);

                // add if not in list
                if (!isDuplicate(meetData.participants, person)) {
                    $("#modal-import-csv-body-status").text(person.name);
                    appendParticipant(person);
                }

            },
            // closes the modal
            complete: () => { $("#modal-import-csv").modal("hide") }
        })
    });

    // Import predefined clubs into options
    $.getJSON("../assets/enrollment/clubs.json", function(data) {
        $.each(data, function(_, val) {
            validClubs.push(val);
        });
    });

    // Set up suggestions for club names
    $("#clubName").autocomplete({
        lookup: validClubs,
        lookupLimit: 6,
        onSelect: (suggestion) => {
            $("#clubName").val(suggestion);
            club = $("#clubName").val();

            showParticipantsTable();
            showImportSection();
            showSummary();

            if (hasIndividualEvents()) {
                openIndividual();
                return;
            }

            if (hasTeamEvents()) {
                openTeam();
                return;
            }
        }
    });

    // add new club event listener
    $("#add-new-club-link").on("click", () => {
        $("#modal-add-club").modal("show");
    });

    $("#modal-add-club-button-success").on("click", () => {
        let customCreatedClub = $("#modal-add-club-content").val()
        $("#modal-add-club").modal("hide");
        $("#clubName").val(customCreatedClub);
        validClubs.push(customCreatedClub);
        club = customCreatedClub;
    });

});
