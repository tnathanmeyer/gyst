const DB_NAME = 'gyst-db';
const STORE_NAME = 'todos';

const addItemForm = document.getElementById('addItemForm');
const itemText = document.getElementById('itemText');
const list = document.getElementById('list');
const numItems = document.getElementById('numItems');

// indexedDB.deleteDatabase(DB_NAME);

const openDbRequest = indexedDB.open(DB_NAME, 1);
let db;

function getStore() {
  if (db) {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return store;
  } else {
    console.error('db is undefined');
  }
}

function setDone(id, checkboxElement) {
  const store1 = getStore();
  const itemRequest = store1.get(id);

  itemRequest.onsuccess = () => {
    const item = itemRequest.result;
    const { done } = item;

    item.done = !done;

    const store2 = getStore();
    const putRequest = store2.put(item);

    putRequest.onsuccess = () => 
      checkboxElement.toggleAttribute('checked');
  }
}

function removeItem(id, itemElement) {
  const store = getStore();
  const deleteRequest = store.delete(id);

  deleteRequest.onsuccess = () => list.removeChild(itemElement);
}

function addListItem(id, title, done = false) {
  const newItemRow = document.createElement('tr');

  const newItemCheckboxColumn = document.createElement('td');
  newItemCheckboxColumn.setAttribute('class', 'item-button');
  const newItemCheckbox = document.createElement('sl-checkbox');
  if (done) {
    newItemCheckbox.toggleAttribute('checked');
  }
  newItemCheckbox.addEventListener('click', () => setDone(id, newItemCheckbox));
  newItemCheckboxColumn.appendChild(newItemCheckbox);

  const newItemTitle = document.createElement('td');
  newItemTitle.setAttribute('class', 'item-title');
  newItemTitle.textContent = title;

  const deleteItemColumn = document.createElement('td');
  deleteItemColumn.setAttribute('class', 'item-button');
  const deleteItemButton = document.createElement('sl-icon-button');
  deleteItemButton.setAttribute('name', 'x');
  deleteItemButton.addEventListener('click', () => removeItem(id, newItemRow));
  deleteItemColumn.appendChild(deleteItemButton);

  newItemRow.appendChild(newItemCheckboxColumn);
  newItemRow.appendChild(newItemTitle);
  newItemRow.appendChild(deleteItemColumn);

  list.appendChild(newItemRow);
}

function addItem(title) {
  const store = getStore();
  if (store) {
    const itemObject = { title, done: false };
    const addRequest = store.add(itemObject);

    addRequest.onsuccess = () => {
      const itemId = addRequest.result;

      addListItem(itemId, title);
    }
  } else {
    console.error('Cannot access store of undefined');
  }
}

openDbRequest.onupgradeneeded = () => {
  db = openDbRequest.result;
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, { autoIncrement: true, keyPath: 'id' });
  }
}

openDbRequest.onsuccess = () => {
  db = openDbRequest.result;
  const store = getStore();
  const allItemsRequest = store.getAll();

  allItemsRequest.onsuccess = () => {
    const items = allItemsRequest.result;

    for (const { title, done, id } of items) {
      addListItem(id, title, done);
    }
  }
}

addItemForm.addEventListener('submit', event => {
  if (event.target.checkValidity()) {
    event.preventDefault();
    addItem(itemText.value);
    itemText.value = '';
  }
})

function setDarkMode() {
  document.documentElement.setAttribute('class', 'sl-theme-dark');
}

function setLightMode() {
  document.documentElement.removeAttribute('class');
}

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  setDarkMode();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
    setDarkMode();
  } else {
    setLightMode();
  }
});

function logChanges(records) {
  for (const record of records) {
    numItems.textContent = record.target.childNodes.length;
  }
}

const observerOptions = {
  childList: true,
};

const observer = new MutationObserver(logChanges);
observer.observe(list, observerOptions);
