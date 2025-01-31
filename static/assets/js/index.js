class ImportStepper {
  constructor() {
    this.SERVER_URL = `https://api.spotistats.app/api/v1`;
    this._code = localStorage.getItem('code');
    this.user;
    this.currentStep;
    this.loader = new Loader();
    this.modalController = new ModalController();

    this.getUser(this._code);
  }

  async getUser(code) {
    this.loader.show();
    let res;
    if (code) {
      res = await fetch(`${this.SERVER_URL}/import/code`, {
        method: 'post',
        body: new URLSearchParams(`code=${code.toUpperCase()}`),
      }).then((res) => res.json());

      if (res.data) {
        this._code = code;
        localStorage.setItem('code', this._code);
        this.user = res.data;
        $('#display-name').text(`Logged in as ${this.user.displayName}`);
        $("#import-code input[type='text']")
          .val(this._code)
          .prop('disabled', true);
      } else {
        delete this._code;
        delete this.user;
      }
    }

    this.currentStep = this._code == undefined ? 0 : 1;
    this.updateInterface();
    this.loader.hide();

    return res;
  }

  async updateInterface() {
    $($('.step-hidden')[this.currentStep]).addClass('step-current');

    if (this._code && this.user) {
      $('#import-code button').addClass('red');
      $('#import-code button').text('Log out');
      $('#authcode').text(`Logged in as ${this.user.displayName}`);
      $('#import-code button').click(() => this.logout());
    }

    const hasFiles = document.getElementById('files').files.length > 0;
    $('#upload').prop('disabled', !hasFiles);
  }

  async nextStep(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.loader.show();
    try {
      if (this.currentStep == 0) {
        await this.step1();
      } else if (this.currentStep == 1) {
        await this.step2();
      }
    } catch (e) {
      this.modalController.openModal('Error', e.message);
    }
    this.updateInterface();
    this.loader.hide();
  }

  async step1() {
    const code = $("#import-code input[type='text']").val();
    if (code && code.length == 6) {
      const res = await this.getUser(code);
      if (res.data) {
      } else if (res.message == 'no user found') {
        this.modalController.openModal('Invalid code', 'Please try try again');
      } else {
        this.modalController.openModal('Error', res.message);
      }
    }
  }

  async step2() {
    return new Promise(async (resolve, reject) => {
      let form_data = new FormData();
      form_data.append('code', this._code.toUpperCase());

      const files = document.getElementById('files').files;
      for (let i = 0; i < files.length; i++) {
        if (!/StreamingHistory[0-9][0-9]?.json/g.test(files[i].name)) {
          return reject(
            new Error(
              `Please only select files named like <i>StreamingHistoryX.json</i><br><br>File name: ${files[i].name}`,
            ),
          );
        }
        form_data.append('files', files[i]);
      }

      const res = await fetch(`${this.SERVER_URL}/import/upload`, {
        method: 'post',
        body: form_data,
      }).then((res) => res.json());

      if (res.data) {
        $('#streams-imported').text(res.data.message);
        $('#upload-files button').prop('disabled', true);
        this.modalController.openModal(
          'Success',
          `${res.data.message} Please follow the instructions of the next step to download the data to your device.`,
        );
        this.currentStep++;
      } else {
        this.modalController.openModal('Error', res.message);
      }
      resolve();
    });
  }

  async logout() {
    localStorage.removeItem('code');
    location.reload();
  }
}

class Loader {
  show() {
    $('#overlay').show();
  }

  hide() {
    $('#overlay').hide();
  }
}

class ModalController {
  constructor() {
    this.template = $('#modal-template').html();
  }

  openModal(title, body) {
    var modal = $(this.template);

    modal.find('.title').html(title);
    modal.find('.body').html(body);

    modal.find('span.close').on('click', function () {
      $(this).parent().parent().remove();
    });

    modal.on('click', function (e) {
      if (e.target == this) {
        $(this).remove();
      }
    });

    $('body').append(modal);
    modal.show();
  }
}

const importStepper = new ImportStepper();

$(document).ready(function () {
  $('#files').change(() => importStepper.updateInterface());

  if (location.hash == '#guide') {
    $('#page-title').text('Import Guide');
    $('.guide-hide').hide();
  }

  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) ||
    typeof window.orientation !== 'undefined' ||
    navigator.userAgent.indexOf('IEMobile') !== -1
  ) {
    importStepper.modalController.openModal(
      'Notice',
      "It looks like your on a mobile device (or tablet). Uploading files from this device may not work and it's highly recommended to do this on a desktop machine.",
    );
  }
});
