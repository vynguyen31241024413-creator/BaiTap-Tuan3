var daysOfWeek = new Array("Mon","Tues","Wed", "Thur", "Fri");

daysOfWeek.push("Sat");

daysOfWeek.unshift("Sun");

// Create the table
document.write("<table border=1>");

// Create the header row
document.write("<tr>");

for (var i = 0; i < daysOfWeek.length; i++) {

    if (daysOfWeek[i].length < 4)
        day = daysOfWeek[i];

    else
        day = "<em>" + daysOfWeek[i] + "</em>";

    document.write("<th>" + day + "</th>");
}

document.write("</tr>");

// Create the calendar dates
var date = 1;

for (var row = 0; row < 5; row++) {

    document.write("<tr>");

    for (var col = 0; col < 7; col++) {

        if (date <= 30) {
            document.write("<td>" + date + "</td>");
            date++;
        }
        else {
            document.write("<td></td>");
        }
    }

    document.write("</tr>");
}

document.write("</table>");