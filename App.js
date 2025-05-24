// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import AuthScreen from './screens/AuthScreen'; // RegisterScreenからAuthScreenに名前変更
import RecordScreen from './screens/RecordScreen';
import MyPageScreen from './screens/MyPageScreen';

import { startLocationTracking, registerForPushNotificationsAsync } from './utils/backgroundLocationTask';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // AuthProviderとuseAuthをインポート
import { auth } from './firebaseConfig'; // authをインポート

// 通知ハンドラの設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

// メインのナビゲーターコンポーネント
const AppNavigator = () => { // ここが問題の箇所かもしれない
  const notificationListener = useRef();
  const responseListener = useRef();

  // テスト用: アプリ起動時に毎回ログイン情報をリセット
  useEffect(() => {
    const resetLogin = async () => {
      try {
        await auth.signOut();
        console.log("App started: User signed out for testing.");
      } catch (error) {
        console.error("Error signing out on app start:", error);
      }
    };
    resetLogin();
  }, []);

  useEffect(() => {
    // 通知権限のリクエストとバックグラウンドタスクの開始
    registerForPushNotificationsAsync();
    startLocationTracking();

    // フォアグラウンドでの通知受信をリッスン (オプション)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // 通知がタップされたときにリッスン (オプション)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'トップページ' }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: '登録・ログイン' }} /> 
        <Stack.Screen name="Record" component={RecordScreen} options={{ title: '記録する' }} />
        <Stack.Screen name="MyPage" component={MyPageScreen} options={{ title: 'マイページ' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// AuthProviderでAppNavigatorをラップ
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
