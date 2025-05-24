// firebaseConfig.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Firebaseコンソールから取得した設定情報をここに貼り付けます
const firebaseConfig = {
  apiKey: "AIzaSyAVrEKn-EGvpTORkzTMnj3HTlivaGbBsUA",
  authDomain: "wanchan-3874d.firebaseapp.com",
  projectId: "wanchan-3874d",
  storageBucket: "wanchan-3874d.firebasestorage.app",
  messagingSenderId: "793436999568",
  appId: "1:793436999568:web:14cc0ca85362320d9d2d15"
};

// Firebaseが初期化されていない場合のみ初期化
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

export { db };
