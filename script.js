
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPVrcDdvMgjUWKL9d_NqYt1RZllJeZIzI",
  authDomain: "industriegebiet2.firebaseapp.com",
  databaseURL: "https://industriegebiet2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "industriegebiet2",
  storageBucket: "industriegebiet2.appspot.com",
  messagingSenderId: "449327174110",
  appId: "1:449327174110:web:aea5aa55cd169b7eb68d4f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();


var db = firebase.database();
var reviews = document.getElementById("reviews");
var reviewsRef = db.ref("/reviews");

reviewForm.addEventListener("submit", e =>{
    var fullName = document.getElementById("fullName");
    var message = document.getElementById("message");
    var hiddenId = document.getElementById("hiddenId");

    var id = hiddenId.value || Date.now();

    db.ref("reviews/" + id).set ({
        fullName: fullName.value,
        message: message.value,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    })
})
