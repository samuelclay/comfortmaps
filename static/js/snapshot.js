window.CM = {};

CM.snapshotVue = new Vue({
    el: ".CM-ratings",
    
    methods: {
        sendSnapshot: function(rating) {
            console.log(['sendSnapshot', rating]);
            const gps = collectGps();
            jQuery.post("/record/snapshot/", {
                rating: rating,
                gps: gps
            })
        }
    }
});

window.collectGps = function() {
    return {'lat': 1, 'long': 20};
}

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", window.csrftoken);
        }
    }
});