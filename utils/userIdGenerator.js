// utils/userIdGenerator.js
import { db } from '../firebaseConfig';

// 8桁の英数字IDを生成する関数
export const generateUniqueUserId = async () => {
  let newUserId;
  let isUnique = false;

  while (!isUnique) {
    // 英数字8桁を生成
    newUserId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const snapshot = await db.collection('users').where('userId', '==', newUserId).get();
    if (snapshot.empty) {
      isUnique = true;
    }
  }
  return newUserId;
};
