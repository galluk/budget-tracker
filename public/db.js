let db;
// create a new db request for a 'budget_db' database.
const request = indexedDB.open('budget_db', 1);

request.onupgradeneeded = function(event) {
   // create object store called 'pending' and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore('pending', { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log('Error! ' + event.target.errorCode);
};

// save the record as a pending transaction
function saveRecord(record) {
  console.log('saving to indexedDB');
  
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(['pending'], 'readwrite');

  // access the pending object store
  const store = transaction.objectStore('pending');

  // add record to the store
  store.add(record);
}

// called when the app is back online
function checkDatabase() {
  // open a transaction on the pending db
  const transaction = db.transaction(['pending'], 'readwrite');
  // access the pending object store
  const store = transaction.objectStore('pending');
  // get all records from store and set to a variable
  const allPending = store.getAll();

  // once all pending transactions have been retreived, post them to the DB
  allPending.onsuccess = function() {
    if (allPending.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(allPending.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, open a transaction on the pending db
        const transaction = db.transaction(['pending'], 'readwrite');

        // access the pending object store
        const store = transaction.objectStore('pending');

        // clear all items in the store
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
