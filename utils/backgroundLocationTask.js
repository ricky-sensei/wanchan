// utils/backgroundLocationTask.js
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { db } from '../firebaseConfig'; // Firebaseからdbをインポート

const LOCATION_TRACKING = 'location-tracking';
const NOTIFICATION_TASK = 'notification-task';

// --- 設定値 ---
const NOTIFICATION_COOLDOWN_TIME = 20 * 60 * 1000; // 20分 (ミリ秒)
const LOCATION_UPDATE_INTERVAL = 20 * 60 * 1000; // 20分後に再開
const NOTIFICATION_RADIUS_KM = 10; // 半径10km

// 2点間の距離を計算する関数 (ヒュベニの公式の簡易版 - 概算)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // km
};

// 通知をスケジュールする関数
const schedulePushNotification = async (title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: { someData: 'goes here' },
    },
    // 10分以内のランダムなタイミングで通知
    trigger: { seconds: Math.floor(Math.random() * (10 * 60)) + 1 }, // 1秒から10分まで
  });
};

// --- バックグラウンド位置情報トラッキングタスク ---
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error('LOCATION_TRACKING error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const currentLocation = locations[0];
    console.log('Background Location Update:', currentLocation.coords);

    // ユーザーがよくいる場所（ここではログインユーザーの平均座標）を取得
    // 実際にはFirestoreからログインユーザーのデータを取得する必要がある
    // 今回はデモのため、MyPageScreenと同様にダミーまたは仮定のユーザーIDで処理
    let myAverageLocation = null;
    try {
      const myUserId = 'dummy_user_id'; // 実際にはストレージなどから取得
      const myRecordsSnapshot = await db.collection('records').where('userId', '==', myUserId).get();
      if (!myRecordsSnapshot.empty) {
        let totalLat = 0;
        let totalLon = 0;
        let count = 0;
        myRecordsSnapshot.forEach(doc => {
          const data = doc.data();
          totalLat += data.latitude;
          totalLon += data.longitude;
          count++;
        });
        myAverageLocation = {
          latitude: totalLat / count,
          longitude: totalLon / count,
        };
      }
    } catch (firebaseError) {
      console.error('FirebaseからMyRecords取得エラー:', firebaseError);
    }

    if (myAverageLocation) {
      const distToMyAverage = getDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        myAverageLocation.latitude,
        myAverageLocation.longitude
      );

      // 自分のよくいる場所から10km以内に入った場合
      if (distToMyAverage <= NOTIFICATION_RADIUS_KM) {
        console.log('Within 10km of my average location. Checking for other users...');

        // 他のユーザーの直近の記録を取得
        const otherRecordsSnapshot = await db.collection('records')
          .where('timestamp', '>', new Date(Date.now() - NOTIFICATION_COOLDOWN_TIME * 2)) // ある程度の期間内の記録
          .orderBy('timestamp', 'desc')
          .get();

        let foundNearbyAttractiveUser = false;
        for (const doc of otherRecordsSnapshot.docs) {
          const record = doc.data();
          // TODO: 自分のユーザーIDと異なるユーザーの記録のみを対象にする
          // if (record.userId === myUserId) continue;

          const distFromOtherUser = getDistance(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            record.latitude,
            record.longitude
          );

          if (distFromOtherUser <= NOTIFICATION_RADIUS_KM) {
            // 他のユーザーが10km以内にいる！
            // TODO: ここで「イケメンまたはイケジョ」の判定ロジックを入れる
            // 例えば、usersコレクションから性別情報を取得して判定するなど
            // 今回はシンプルに「他のユーザーがいる」と判定
            foundNearbyAttractiveUser = true;
            break;
          }
        }

        if (foundNearbyAttractiveUser) {
          console.log('Nearby attractive user found! Scheduling notification.');
          await schedulePushNotification(
            '近くにいるかも！',
            'あなたの場所の近くに、イケメンまたはイケジョがいるかも'
          );

          // 通知を出したら20分間は通知を出さないようにし、現在地の取得も中止し、現在地情報を初期化
          await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
          console.log('Location tracking stopped for 20 minutes.');

          // 20分後に再度位置情報トラッキングを開始するタスクをスケジュール
          setTimeout(async () => {
            const hasPermission = await Location.hasBackgroundPermissionsAsync();
            if (hasPermission) {
              await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 60000, // 1分ごとに更新（バッテリー考慮）
                distanceInterval: 100, // 100m移動したら更新
                deferredUpdatesInterval: 1000, // Android: バッテリー最適化
              });
              console.log('Location tracking resumed after 20 minutes.');
            } else {
              console.warn('Background location permission not granted, cannot resume tracking.');
            }
          }, NOTIFICATION_COOLDOWN_TIME); // 20分後
        }
      }
    }
  }
});

// バックグラウンドタスクを開始/停止するヘルパー関数
export const startLocationTracking = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status === 'granted') {
    await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000, // 1分ごとに更新（バッテリー考慮）
      distanceInterval: 100, // 100m移動したら更新
      deferredUpdatesInterval: 1000, // Android: バッテリー最適化
    });
    console.log('Background location tracking started.');
  } else {
    console.warn('Background location permission not granted.');
  }
};

export const stopLocationTracking = async () => {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
    console.log('Background location tracking stopped.');
  }
};

// 通知権限リクエスト
export const registerForPushNotificationsAsync = async () => {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('通知権限', '通知を受け取るために、設定で通知を許可してください。');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);

  return token;
};
