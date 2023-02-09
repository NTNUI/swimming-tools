function sanitizeName(name){
    // retruns nothing if
    // - input is empty
    // - input contains digits
    // - length of the name is less than 4 characters
    //
    // Removes:
    // - double whitespaces
    // - whitescpace in front of the name
    // - whitespaces in the end of the name
    // Modifies:
    // - sets capital letter only on first letter and first letter after whitespace

    if(!name){
        return false;
    }

    if(name.length < 4){
        return false;
    }

    // check if name contains digits
    for(i = 0; i < name.length - 1; i++){
        if(Number(name[i])){
            return false;
        }
    }

    // compress multiple spaces into one space
    name = name.replace(/\s+/g, ' ');

    // removed spaces at the start of the name
    if(name[0] == " "){
        name = name.substring(1);
        sanitized = false;
    }
    // removed spaces at the end of the name
    if(name[name.length - 1] == " "){
        name = name.substring(0, name.length - 1);
        sanitized = false;
    }

    // check if name contains digits
    for(let i = 0; i < name.length - 1; i++){

        if(Number(name[i])){
            return false;
        }
    }

    name = name.toLowerCase();
    // Set capital letter on first letter
    name = name[0].toUpperCase() + name.substring(1);

    // Set capital letter on first letter after each space or dash
    for(let i = 0; i < name.length - 2; i++){
        if(name[i] == " "){
                name = name.substring(0,i) + " " + name[i+1].toUpperCase() + name.substring(i+2);
        }
        if(name[i] == "-"){
            name = name.substring(0,i) + "-" + name[i+1].toUpperCase() + name.substring(i+2);
        }
    }
    return name;
}
function isDuplicate(participants, person){
    if(!participants){
        return;
    }
    if(!person){
        return;
    }
    for (let i = 0; i < participants.length - 1; i++){
        if(participants[i].name == person.name && participants[i].birthYear == person.birthYear){
            return true;
        }
    }
    return false;
}

function isValidBirthYear(birthYear){
    // returns false if the year is not a four digit number
    if(birthYear > 9999 || birthYear < 1000){
        return false;
    }

    return true;
}

function isOldEnough(birthYear, meetType = "regular"){
    // returns true if athlete is old enough for specified meet
    // returns false otherwise    
    meetType = meetType || "regular";
    
    const MINAGE_REGULAR = 9;
    const MINAGE_REQRUIT = 4;
    const MAXAGE = 110;
    const MINAGE_NATIONAL = 11;
    const MAXAGE_YOUTH_NATIONAL = 16;
    const MINAGE_INTERNATIONAL = 13;


    age = getAge(birthYear)


    if(age >= MINAGE){
        return true;
    }

    return false;
}

function getAge(birthYear){
    if(!isValidBirthYear(birthYear)){
        throw "Not a valid birth year"
    }
    currentYear = new Date().getFullYear();
    return currentYear - birthYear;
}