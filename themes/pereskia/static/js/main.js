$(document).ready(function () {

  var hiddenessThreshold  = 70;
  var visibilityThreshold = 75;

  function isHidden (element) {
    return element.css('visibility') === 'hidden';
  }

  function makeVisible (element) {
    element.css('visibility', 'visible');
  }

  function makeHidden (element) {
    element.css('visibility', 'hidden');
  }

  function hasElement (name) {
    return $(name).length
  }

  /**
   * Shows the responsive navigation menu on mobile.
   */
  $('#header > #nav > ul > .icon').click(function () {
    $('#header > #nav > ul').toggleClass('responsive');
  });

  /**
   * Controls the different versions of  the menu in blog post articles
   * for Desktop, tablet and mobile.
   */
  if (hasElement('.post')) {
    var menu     = $('#menu');
    var nav      = $('#menu > #nav');
    var menuIcon = $('#menu-icon, #menu-icon-tablet');

    function navIsHidden () {
      return isHidden(nav);
    }

    function showNav () {
      makeVisible(nav);
    }

    function hideNav () {
      makeHidden(nav);
    }

    function menuIsHidden () {
      return isHidden(menu);
    }

    function showMenu () {
      makeVisible(menu);
      menuIcon.addClass('active');
    }

    function hideMenu () {
      makeHidden(menu);
      menuIcon.removeClass('active');
    }

    function menuTopOffset () {
      return menu.offset().top
    }

    /**
     * Display the menu on hi-res laptops and desktops.
     */
    if ($(document).width() >= 1440) {
      showMenu();
    }

    /**
     * Display the menu if the menu icon is clicked.
     */
    menuIcon.click(function () {
      if (menuIsHidden()) {
        showMenu();

        if (hasElement('#menu') && menuTopOffset() < hiddenessThreshold) {
          showNav();
        }
      } else {
        hideMenu();
        hideNav();
      }

      return false;
    });

    /**
     * Add a scroll listener to the menu to hide/show the navigation links.
     */
    if (hasElement('#menu')) {
      $(window).on('scroll', function () {
        var menuIconT         = $('#menu-icon-tablet');
        var topIconT          = $('#top-icon-tablet');
        var menuIconIsVisible = $('#menu-icon').is(':visible');

        if (!menuIsHidden() && navIsHidden() && menuTopOffset() < hiddenessThreshold) {
          showNav();
        }

        if (!navIsHidden() && menuTopOffset() > visibilityThreshold) {
          hideNav();
        }

        // on tablet, hide the navigation icon as well and show a "scroll to top
        // icon" instead
        if (!menuIconIsVisible) {
          if (menuTopOffset() < hiddenessThreshold) {
            menuIconT.show();
            topIconT.hide();
          }

          if (menuTopOffset() > visibilityThreshold) {
            menuIconT.hide();
            topIconT.show();
          }
        }
      });
    }

    /**
     * Show mobile navigation menu after scrolling upwards,
     * hide it again after scrolling downwards.
     */
    if (hasElement('#footer-post')) {
      var lastScrollTop = 0;

      $(window).on('scroll', function () {
        var topDistance   = $(window).scrollTop();
        var footerPost    = $('#footer-post');
        var actionsFooter = $('#actions-footer > #top');

        if (topDistance > lastScrollTop) {
          footerPost.hide(); // downscroll -> show menu
        } else {
          footerPost.show(); // upscroll -> hide menu
        }

        lastScrollTop = topDistance;

        // close all submenu"s on scroll
        $('#nav-footer').hide();
        $('#toc-footer').hide();
        $('#share-footer').hide();

        // show a "navigation" icon when close to the top of the page,
        // otherwise show a "scroll to the top" icon
        if (topDistance < hiddenessThreshold) {
          actionsFooter.hide();
        }

        if (topDistance > visibilityThreshold) {
          actionsFooter.show();
        }
      });
    }
  }

});
