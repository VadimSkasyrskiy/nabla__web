$('.menu-icon').on('click', function(e) {

    
    no_scroll();

    $('.main-header').toggleClass('active');

    $('.menu-overlay').on('click', function(e) {

        $('.main-header').removeClass('active');
        no_scroll();
    })
});

function no_scroll() {

    if($('body').hasClass('no-scroll')) {
        setTimeout(function() {
            $('body').removeClass('no-scroll');
        }, 450);
    } else {
        $('body').addClass('no-scroll');
    }
   
}

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {

} else {
    $('body').addClass('not-mobile');
}