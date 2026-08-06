
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyABWtZFepD4wLmbx1EhcVENfwDiOygSBSg",
    authDomain: "pibo-c87f1.firebaseapp.com",
    databaseURL: "https://pibo-c87f1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pibo-c87f1",
    storageBucket: "pibo-c87f1.firebasestorage.app",
    messagingSenderId: "1000692640688",
    appId: "1:1000692640688:web:abe607c570bb48ac3b0475",
    measurementId: "G-NTRQRW9LZN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// Helper functions
const dbRef = (path) => db.ref(path);
const pushData = (path, data) => db.ref(path).push(data);
const setData = (path, data) => db.ref(path).set(data);
const getData = (path) => db.ref(path).once('value');
const onValue = (path, callback) => db.ref(path).on('value', callback);
const removeData = (path) => db.ref(path).remove();
const updateData = (path, data) => db.ref(path).update(data);

export { db, storage, dbRef, pushData, setData, getData, onValue, removeData, updateData };
