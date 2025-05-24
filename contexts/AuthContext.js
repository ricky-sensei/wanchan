// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebaseConfig'; // authとdbをインポート
import { Alert } from 'react-native';

// AuthContextを作成
const AuthContext = createContext();

// AuthProviderコンポーネント
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase Authenticationのユーザーオブジェクト
  const [userProfile, setUserProfile] = useState(null); // Firestoreに保存されたユーザープロフィール (ニックネーム、userIdなど)
  const [loading, setLoading] = useState(true); // 認証状態の初期ロード中フラグ

  useEffect(() => {
    // Firebase Authenticationの認証状態の変化を監視
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // ユーザーがログインしている場合
        setCurrentUser(user);
        try {
          // Firestoreからユーザープロフィールを取得
          const userDoc = await db.collection('users').where('firebaseUid', '==', user.uid).get();
          if (!userDoc.empty) {
            setUserProfile({ id: userDoc.docs[0].id, ...userDoc.docs[0].data() });
          } else {
            // Firestoreにプロフィールがない場合（例: 匿名ログインなど）
            setUserProfile(null);
            console.warn("Firestoreにユーザープロフィールが見つかりませんでした。");
          }
        } catch (error) {
          console.error("Firestoreからユーザープロフィール取得エラー:", error);
          Alert.alert("エラー", "ユーザープロフィールの読み込みに失敗しました。");
          setUserProfile(null);
        }
      } else {
        // ユーザーがログアウトしている場合
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false); // ロード完了
    });

    // コンポーネントのアンマウント時に監視を解除
    return unsubscribe;
  }, []);

  // コンテキストの提供値
  const value = {
    currentUser,
    userProfile, // Firestoreのユーザープロフィール (nickname, userIdなどを含む)
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* ロードが完了してから子コンポーネントをレンダリング */}
    </AuthContext.Provider>
  );
};

// AuthContextを使用するためのカスタムフック
export const useAuth = () => {
  return useContext(AuthContext);
};
