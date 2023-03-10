window.TextEncoder = window.TextDecoder = null;
/*
We cannot get the file directley from medley due to browser security issues
Web browsers are enforcing CORS policy and they require a "Access-Control-Allow-Origin: *"
header present and mode set as "no-cors". However this breaks compatability with the request.
Solution is to either contact medley.no maintainer and request them to allow CORS or to set
up a custom server to get the data and forward it to clients with CORS. The latter is the
solution right now. 
*/
const medley_url = "https://olavbb.com/dot-slash-victoria/medley_reserver"; // For testing

const getResource = function(type, name) {
    let url = window.location.href;

    url = url.substring(0, url.indexOf("dot-slash-victoria") + "dot-slash-victoria".length);
    return url + "/" + type + "/" + name;
}


function generateTabBar(base) {
    let tabMenu = document.createElement("div");
    tabMenu.classList.add("tabMenu", "navbar");

    const children = base.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (i != 0) child.classList.add("hidden");
        const button = document.createElement("button");
        button.addEventListener("click", (event) => {
            if (!event.target.classList.contains("disabled")) {
                showTab(base, child, false);
            }
        });
        button.classList.add("t", "button");
        button.innerText = child.getAttribute("data-text");
        button.id = "tabButton" + child.id;
        tabMenu.appendChild(button);
    }

    base.prepend(tabMenu);
}

function showModal(id, body, cb_confirm, cb_cancel, options) {
    options = options || {};
    cb_cancel = cb_cancel || function() {};
    body = body || document.createTextNode("Are you sure you want to do that?");
    const modal = $("#" + id);
    if (!modal) return;
    modal.find(".modal-body").html("");
    modal.find(".modal-body").append(body);
    if (options.header) modal.find(".modal-title").text(options.header);

    const confirmBtn = modal.find(".modal-footer").find(".btn-success");
    confirmBtn.off("click");
    confirmBtn.on("click", function() {
        cb_confirm();
        modal.modal("hide");
    });
    modal.off("hidden.bs.modal");
    modal.on("hidden.bs.modal", function() {
        cb_cancel();
    });

    modal.modal();
    return modal;
}

function enableTab(tabName) {
    const button = document.getElementById("tabButton" + tabName);
    button.classList.remove("disabled");
}

function disableTab(tabName) {
    const button = document.getElementById("tabButton" + tabName);
    button.classList.add("disabled");
}

function showTab(tabs, tab, disableTabs = true) {
    const children = tabs.children;
    for (let i = 1; i < children.length; i++) {
        const child = children[i];
        const visible = child == tab;
        if (visible) {
            child.classList.remove("hidden");
        } else {
            child.classList.add("hidden");
        }
    }

    if (!disableTabs) return;
    //Update button styles
    const buttons = children[0].children;
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        button.classList.add("disabled");
    }
}

function addClickToEdit(element, display, field) {
    element.addEventListener("click", function() {
        display.element.classList.add("hidden");
        field.classList.remove("hidden");
    });

    field.addEventListener("change", function() { display.changeCB(field.value) });
    field.addEventListener("unfocus", function() {
        display.element.classList.remove("hidden");
        field.classList.add("hidden");
    });
}


function getMedleyMeet(url, callback) {
    const dest = medley_url + "/event.php?doc=" + url.substring(url.indexOf("/", url.indexOf("://") + 3));
    fetch(dest).then((response) => {
        //For some reason this xml is not UTF-8, we need to convert
        const reader = response.body.getReader();
        const decoder = new TextDecoder("iso-8859-1");

        let text = "";
        reader.read().then(function process(data) {
            if (data.done) return;
            text += decoder.decode(data.value, { stream: true });
            return reader.read().then(process);
        }).then(() => {
            callback(text);
        });
    });
}

function getMedleyList(callback) {
    let url = medley_url;
    fetch(url + "/list.php").then((response) => response.text()).then((text) => {

        const xml = parseXml(text);
        const meets = xml.ArrayOfStrc_stevneoppsett.strc_stevneoppsett;
        const result = [];
        for (let i in meets) {
            const m = meets[i];
            const start = getNode(m, "fradato");
            const end = getNode(m, "tildato");
            const meet = {
                name: getNode(m, "stevnenavn"),
                organizer: getNode(m, "arrangor"),
                url: getNode(m, "xmllink"),
                startDate: new Date(start.substring(0, 4) + "-" + start.substring(4, 6) + "-" + start.substring(6)),
                endDate: new Date(end.substring(0, 4) + "-" + end.substring(4, 6) + "-" + end.substring(6)),
            }
            result.push(meet);
        }
        callback(result);
    });
}

function download(filename, text) {
    var element = document.createElement('a');
    const data = new TextEncoder("iso-8859-15", { NONSTANDARD_allowLegacyEncoding: true }).encode(text);
    const b = new Blob([data], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(b);
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

$(() => onLoad());

function onLoad() {
    const tabBars = document.getElementsByClassName("tabBar");
    for (let i = 0; i < tabBars.length; i++) {
        generateTabBar(tabBars[i]);
    }
}