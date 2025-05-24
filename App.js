// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import RecordScreen from './screens/RecordScreen';
import MyPageScreen from './screens/MyPageScreen';
import { startLocationTracking, registerForPushNotificationsAsync } from './utils/backgroundLocationTask';

// 通知ハンドラの設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

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
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'ユーザー登録' }} />
        <Stack.Screen name="Record" component={RecordScreen} options={{ title: '記録する' }} />
        <Stack.Screen name="MyPage" component={MyPageScreen} options={{ title: 'マイページ' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
