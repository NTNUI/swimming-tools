const pages = {
    "home": {
        "Enrollment": { "no": "Påmelding" },
        "header": { "en": "./victoria - helper tools for swimmers", "no": "./victoria - hjelpeverktøy for svømmere" },
        "lang_en": { "en": "English", "no": "Engelsk" },
        "lang_no": { "en": "Norwegian", "no": "Norsk" },
        "Language:": { "no": "Språk:" },
        "theme_dark": { "en": "Dark", "no": "Mørk" },
        "theme_light": { "en": "Light", "no": "Lys" },
        "Theme": { "no": "Fargetema" },
        "title": { "en": "./victoria" },
    },
    "enrollment": {
        "Actions": { "no": "Handlinger" },
        "Add a new club to the list. If this club excists in medley.no then send us a message and we will add i it to the list. Please dont use abbreviations": { "no": "Legg til en ny klubb i listen. Hvis klubben eksisterer på medley.no gi oss beskjed om det slik at vi får lagt den inn. Ikke bruk forkortelser" },
        "Add club": { "no": "Legg til ny klubb" },
        "Add events...": { "no": "Legg til øvelser ..." },
        "Add more...": { "no": "Legg til flere..." },
        "Add": { "no": "Legg til" },
        "Anticipated time": { "no": "Påmeldingstid" },
        "Cancel": { "no": "Avbryt" },
        "Change name": { "no": "Endre navn" },
        "Choose club": { "no": "Velg klubb" },
        "Choose file": { "no": "Velg fil" },
        "Class": { "no": "Aldersklasse" },
        "Club settings": { "no": "Klubbinstillinger" },
        "Confirm": { "no": "Bekreft" },
        "Confirmation": { "no": "Bekreftelse" },
        "Delete": { "no": "Slett" },
        "Don't see your club in the list?": { "no": "Ser du ikke klubben din i listen?" },
        "Download": { "no": "Last ned" },
        "Enrollment": { "no": "Påmelding" },
        "Event id": { "no": "Øvelsesnummer" },
        "Event": { "no": "Øvelse" },
        "Events": { "no": "Øvelser" },
        "Female": { "no": "Kvinne" },
        "Import enrolled from tryggivann.no": { "no": "Importer påmeldte fra tryggivann.no" },
        "Import from medley.no": { "no": "Importer fra medley.no" },
        "Import from uni_p.txt": { "no": "Importer fra uni_p.txt" },
        "Import meetsetup from XML": { "no": "Importer fra XML-fil" },
        "Import": { "no": "Importer" },
        "Importing from tryggivann": { "no": "Importerer fra tryggivann" },
        "Importing": { "no": "Importerer" },
        "Individuals": { "no": "Individuelle utøvere" },
        "Junior": { "no": "Junior" },
        "Male": { "no": "Mann" },
        "Meet details": { "no": "Stevnedetaljer" },
        "Meet name": { "no": "Stevnenavn" },
        "Mixed": { "no": "Mixed" },
        "Name": { "no": "Navn" },
        "Participants": { "no": "Deltakere" },
        "Select meet": { "no": "Velg stevne" },
        "Selected club:": { "no": "Velg klubb" },
        "Senior": { "no": "Senior" },
        "Set club name:": { "no": "Legg til klubbnavn" },
        "Gender": { "no": "Kjønn" },
        "Summary": { "no": "Sammendrag" },
        "Team name": { "no": "Lagnavn" },
        "Teams": { "no": "Lagutøvere" },
        "Will swim?": { "no": "Skal svømme?" },
        "Birth year": { "no": "Fødselsår" },
        "You have not yet selected a meet": { "no": "Du har ikke valgt et stevne enda" },
    },
    "newMeet": {

    }
}

function Translator() {
    let url = new URL(window.location.href);
    this.page = url.pathname.substring(url.pathname.lastIndexOf("/"))
    this.page = this.page.substring(1, this.page.indexOf("."))
    this.pages = pages;

    this.LoadTranslation = function(page, language) {
        console.log("[Translator::LoadTranslation] This operation is not supported yet, as it requires a host for the translation files");
        return false;
        language = language || "en";
        let translation;
        let res = this.url + "/res/";
        res += page;
        if (language != "en") res += "." + language;
        res += ".json";
        console.log("Fetching translation from " + res);
        return fetch(res).then((response) => {
            if (response.code !== 200) {
                if (lang != "en") return this.LoadTranslation(page);
                return false;
            }
            pages[page] = pages[page] || {};
            response.json().then((json) => {
                for (let i in json) {
                    pages[page][i][language] = json[i];
                }
                return pages[page];
            });
        });
    }
    this.SetLanguage = function(lang) {
        this.language = lang;
        for (let p in pages) {
            this.LoadTranslation(p, lang);
        }
        window.localStorage.setItem("language", lang);
        $(".languageText").text(this.getTranslation("lang_" + lang));
    }
    this.addTranslations = function(page, language, translations) {

    }
    this.getTranslation = function(key, page) {
        page = page || this.page;
        if (!this.pages[page]) page = "home";
        const p = this.pages[page];
        if (!p[key]) {
            if (page != "home") return this.getTranslation(key, "home");
            console.log("[Translator::getTranslation] Unable to find key: " + key);
            return false;
        }
        const val = p[key];
        if (!val[this.language]) {
            if (val.en) return val.en;
            return false;
        }
        return val[this.language];
    }
    this.Translate = function() {
        const nodes = $(".t");
        this.nodes = this.nodes || [];
        const findNode = function(node, nodes) {
            for (let n in nodes) {
                if (nodes[n].el == node) return n;
            }
            return false;
        }
        nodes.text((i, text) => {
            let index = findNode(nodes[i], this.nodes);
            if (index === false) {
                this.nodes.push({ el: nodes[i], key: text });
                index = findNode(nodes[i], this.nodes);
            }
            const trans = this.getTranslation(this.nodes[index].key);
            return trans !== false ? trans : this.nodes[index].key;
        });
    }
}

let translator = new Translator();

function addLanguage(language) {
    let text;
    switch (language) {
        case "no":
            text = "Norsk";
            break;
        case "en":
            text = "English";
            break;
    }
    $("<a href='javascript:void(0)'></a>")
        .addClass("dropdown-item")
        .append($("<span>").addClass("t").text("lang_" + language))
        .on("click", () => {
            if (!translator) return;
            translator.SetLanguage(language);
            translator.Translate();
        }).appendTo($(".langList"));
}
window.addEventListener("load", function() {
    addLanguage("en");
    addLanguage("no");
    let language = window.localStorage.getItem("language");
    translator.SetLanguage(language || "en");
    translator.Translate();
});