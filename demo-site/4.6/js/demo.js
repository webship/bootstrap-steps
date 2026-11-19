// The scripts of the 4.6 demo pages. 4.6 sets up its plugins through jQuery: tooltips, popovers and
// toasts are opt-in, so they are set up here, as its documentation does. Then the same small
// stand-ins as the 5.3 pages: the live alert and toasts, the dialog that fills itself in, the
// validation starter, a choice that changes the page, a list that loads, an upload.
$(function () {
  'use strict';

  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();
  $('.toast').toast();

  $('#liveAlertBtn').on('click', function () {
    $('#liveAlertPlaceholder').append([
      '<div class="alert alert-success alert-dismissible fade show" role="alert">',
      '   <div>Nice, you triggered this alert message!</div>',
      '   <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>',
      '</div>',
    ].join(''));
  });

  $('#liveToastBtn').on('click', function () {
    $('#liveToast').toast('show');
  });
  $('[data-demo-toast]').on('click', function () {
    $($(this).data('demoToast')).toast('show');
  });

  $('#exampleModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    if (!button.length) return;
    var recipient = button.data('whatever');
    var modal = $(this);
    modal.find('.modal-title').text('New message to ' + recipient);
    modal.find('.modal-body input').val(recipient);
  });

  $('.needs-validation').each(function () {
    var form = this;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add('was-validated');
      var result = document.getElementById('validation-result');
      if (result) {
        result.innerHTML = form.checkValidity()
          ? '<div class="alert alert-success" role="alert">Thanks, the form is valid and was sent.</div>'
          : '';
      }
    }, false);
  });

  $('[data-demo-choice]').on('click', function () {
    $('#choice-output').text('Size: ' + $(this).data('demoChoice') + '.');
  });

  $('#loadResultsBtn').on('click', function () {
    var button = this;
    button.disabled = true;
    $('#results').html('<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading results...</span></div>');
    setTimeout(function () {
      $('#results').html('<p>3 results found.</p><ul class="list-group"><li class="list-group-item">Garden chair</li><li class="list-group-item">Kitchen chair</li><li class="list-group-item">Office chair</li></ul>');
      button.disabled = false;
    }, 3000);
  });

  $('#startUploadBtn').on('click', function () {
    var button = this;
    var bar = document.getElementById('uploadProgress');
    var value = 0;
    button.disabled = true;
    $('#uploadStatus').text('Uploading...');
    var step = function () {
      value += 10;
      bar.setAttribute('aria-valuenow', String(value));
      bar.style.width = value + '%';
      if (value < 100) {
        setTimeout(step, 150);
      } else {
        $('#uploadStatus').text('Upload complete.');
        button.disabled = false;
      }
    };
    setTimeout(step, 150);
  });
});
