/*global SimpleMDE, require */

const { rendererPreload } = require('electron-routes');

const { ipcRenderer, remote } = require('electron');

const { Menu } = remote

let thepage;
let simplemde = new SimpleMDE();
let editing = false;

rendererPreload();

var get = function (page, e) {
  thepage = page;
  fetch(`wiki://get/${page}`)
    .then(response => response.json())
    .then(render);

  // Make the title right
  document.querySelector('header > span').innerText = thepage;

  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
};

var render = function (page) {
  document.querySelector('main').innerHTML = page.html;
  document.querySelector('textarea').innerHTML = page.markdown;
  simplemde.value(page.markdown);

  // Make sure we're not in edit mode
  document.querySelector('main').style.display = 'block';
  document.querySelector('aside').style.display = 'none';

  init();
};

var edit = function () {
  document.querySelector('main').style.display = 'none';
  document.querySelector('aside').style.display = 'block';

  simplemde.value(document.querySelector('textarea').value);

  editing = true;

  document.querySelector('button').innerText = 'Save';
};

var save = function (refresh) {
  // Do something here with the markdown that was generated. Send it to the server and just refresh the page
  var markdown = simplemde.value();

  // Send this to the server
  var method = 'POST';
  var body = JSON.stringify({
    markdown,
  });
  var headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'text/html, */*'
  });
  fetch(`wiki://edit/${thepage}`, { method, body, headers })
    .then(refresh ? get.bind(this, thepage) : function () { });

  if (refresh) {
    editing = false;
    document.querySelector('button').innerText = 'Edit';
  }
}

var nolink = function (link, page) {
  if (!page.exists) {
    link.classList.add('non-existing');
  }
};

var init = function () {
  var links = document.querySelectorAll('a');
  for (let link of links) {
    // See if it's an internal link
    var href = link.getAttribute('href');
    if (href && href.indexOf('://') < 0) {
      // Check to see if the page exists
      fetch(`wiki://exists/${href}`).then(response => response.json()).then(nolink.bind(this, link))

      // Make an onclick listener
      link.addEventListener('click', get.bind(this, href));
    } else {
      link.classList.add('external');
    }
  }
};

/// Start by getting the main page
get('_');
init();

document.querySelector('button').addEventListener('click', function () {
  editing ? save(true) : edit();
});

document.querySelector('a#home').addEventListener('click', function () {
  get('_');
});

window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    var mainMenu = Menu.getApplicationMenu().items.filter(function(item){
      return item.label == "Edit";
    })[0].submenu;
    mainMenu.popup(remote.getCurrentWindow());
}, false);

// Autosave
setInterval(function () {
  if (editing) {
    save(false);
  }
}, 10 * 1000);

ipcRenderer.on('file-save', function() {
  save(false);
});
