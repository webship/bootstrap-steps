// The scripts of the demo pages. What the documentation's own pages run: tooltips and popovers
// are opt-in, so they are set up here; the live alert, the live toast and the dialog that fills
// itself in from the button that opened it; the starter script of the validation example. And
// three stand-ins for what a site does on its own: a choice that changes the page, a list that
// loads, an upload.
(() => {
  'use strict';

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => new bootstrap.Tooltip(element));
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach((element) => new bootstrap.Popover(element));

  // The live alert: each click adds a dismissible alert.
  const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
  const alertTrigger = document.getElementById('liveAlertBtn');
  if (alertPlaceholder && alertTrigger) {
    alertTrigger.addEventListener('click', () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = [
        '<div class="alert alert-success alert-dismissible" role="alert">',
        '   <div>Nice, you triggered this alert message!</div>',
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>',
      ].join('');
      alertPlaceholder.append(wrapper);
    });
  }

  // The live toast, and the buttons that show the other toasts of the page.
  const toastTrigger = document.getElementById('liveToastBtn');
  const toastLiveExample = document.getElementById('liveToast');
  if (toastTrigger && toastLiveExample) {
    const toast = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
    toastTrigger.addEventListener('click', () => toast.show());
  }
  document.querySelectorAll('[data-demo-toast]').forEach((button) => {
    button.addEventListener('click', () => {
      button.dataset.demoToast.split(',').forEach((selector) => {
        bootstrap.Toast.getOrCreateInstance(document.querySelector(selector)).show();
      });
    });
  });

  // The dialog filled in from the button that opened it, when it starts to show.
  const exampleModal = document.getElementById('exampleModal');
  if (exampleModal) {
    exampleModal.addEventListener('show.bs.modal', (event) => {
      const button = event.relatedTarget;
      if (!button) return;
      const recipient = button.getAttribute('data-bs-whatever');
      exampleModal.querySelector('.modal-title').textContent = `New message to ${recipient}`;
      exampleModal.querySelector('.modal-body input').value = recipient;
    });
  }

  // Validation: the starter script of the example. A valid form is not sent anywhere; a message
  // says it would have been.
  document.querySelectorAll('.needs-validation').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add('was-validated');
      const result = document.getElementById('validation-result');
      if (result) {
        result.innerHTML = form.checkValidity()
          ? '<div class="alert alert-success" role="alert">Thanks, the form is valid and was sent.</div>'
          : '';
      }
    }, false);
  });

  // A choice that changes the page.
  document.querySelectorAll('[data-demo-choice]').forEach((item) => {
    item.addEventListener('click', () => {
      const output = document.getElementById('choice-output');
      if (output) output.textContent = `Size: ${item.dataset.demoChoice}.`;
    });
  });

  // A list that loads: a spinner turns while a stand-in request takes about three seconds.
  const loadResults = document.getElementById('loadResultsBtn');
  const results = document.getElementById('results');
  if (loadResults && results) {
    loadResults.addEventListener('click', () => {
      loadResults.disabled = true;
      results.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading results...</span></div>';
      setTimeout(() => {
        results.innerHTML = '<p>3 results found.</p><ul class="list-group"><li class="list-group-item">Garden chair</li><li class="list-group-item">Kitchen chair</li><li class="list-group-item">Office chair</li></ul>';
        loadResults.disabled = false;
      }, 3000);
    });
  }

  // An upload: the bar fills in steps of ten, then a message says it is done.
  const startUpload = document.getElementById('startUploadBtn');
  const upload = document.getElementById('uploadProgress');
  const uploadStatus = document.getElementById('uploadStatus');
  if (startUpload && upload && uploadStatus) {
    startUpload.addEventListener('click', () => {
      startUpload.disabled = true;
      let value = 0;
      uploadStatus.textContent = 'Uploading...';
      const step = () => {
        value += 10;
        upload.setAttribute('aria-valuenow', String(value));
        upload.querySelector('.progress-bar').style.width = `${value}%`;
        if (value < 100) {
          setTimeout(step, 150);
        } else {
          uploadStatus.textContent = 'Upload complete.';
          startUpload.disabled = false;
        }
      };
      setTimeout(step, 150);
    });
  }
})();
