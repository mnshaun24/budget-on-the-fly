let db;

// establish connection to IndexedDB
const request = indexedDB.open("budget-on-the-fly", 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    // create an object store that auto increments
    db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function(event) {
    // on success
    db = event.target.result;

    // send info if online
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function uploadBudget() {
    // open a transaction in the db
    const transaction = db.transaction(["new_budget"], "readwrite");

    // access the object store
    const budgetObjectStore = transaction.objectStore("new_budget");

    // get all records from store and set to variable
    const getAll = budgetObjectStore.getAll();
    getAll.onsuccess = function() {
        // if data in indexedDB store, send to api server
        if (getAll.result.length > 0) {
            fetch("/api", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(["new_budget"], "readwrite");
                const budgetObjectStore = transaction.objectStore("new_budget");
                budgetObjectStore.clear();

                alert("Saved budget entries were submitted successfully!");
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

// listen for app to come back online
window.addEventListener("online", uploadBudget);