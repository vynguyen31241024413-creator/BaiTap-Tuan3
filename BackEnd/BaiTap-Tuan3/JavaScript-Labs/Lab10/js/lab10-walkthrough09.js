
$(function() {

    $("#consume").click(function() {

        var url = "https://jsonplaceholder.typicode.com/users";

        // Create an empty unordered list
        $("#results").html("<ul></ul>");

        // Send GET request
        $.get(url, function(data, status) {

            // Check request status
            if (status == "success") {

                // Loop through returned data
                $.each(data, function(index, value) {

                    var li = $('<li/>').html(value.name);

                    li.appendTo("div#results ul");

                });

            }

        });

    });

});
