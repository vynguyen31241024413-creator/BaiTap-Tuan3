
$(function() {

    // Hide loading animation initially
    $('.animLoading').hide();

    $("#consume").click(function() {

        // Show loading animation
        $('.animLoading').show();

        // API URL
        var url = "https://jsonplaceholder.typicode.com/users";

        $.get(url)

        // Execute when request succeeds
        .done(function(data) {

            $("#results ul").empty();

            $.each(data, function(index, value) {

                var li = $('<li/>').html(value.name);

                li.appendTo("div#results ul");

            });

        })

        // Execute when request fails
        .fail(function(xhr, status, error) {

            alert("failed loading data - status=" + status +
                  " error=" + error);

        })

        // Always execute when request finishes
        .always(function(data) {

            $('.animLoading').fadeOut("slow");

        });

    });

});
