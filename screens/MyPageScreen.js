// screens/MyPageScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import * as Location from 'expo-location';

const MyPageScreen = () => {
  const [myRecords, setMyRecords] = useState([]);
  const [nearbyComments, setNearbyComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null); // 現在のユーザーの位置情報 (ダミー、実際はログインユーザーの記録から取得)

  // ユーザーがよく押す場所（ここでは仮に平均座標とする）を計算する関数
  const calculateAverageLocation = (records) => {
    if (records.length === 0) {
      return null;
    }
    let totalLat = 0;
    let totalLon = 0;
    records.forEach(record => {
      totalLat += record.latitude;
      totalLon += record.longitude;
    });
    return {
      latitude: totalLat / records.length,
      longitude: totalLon / records.length,
    };
  };

  // 2点間の距離を計算する関数 (ヒュベニの公式の簡易版 - 概算)
  // 厳密な距離計算が必要な場合はより正確なライブラリや実装を使用してください
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

  useEffect(() => {
    const fetchMyAndNearbyRecords = async () => {
      setLoading(true);
      try {
        // TODO: 実際のユーザーIDに基づいて自分の記録を取得する
        // 今回はユーザー認証を実装していないため、すべての記録から自分の記録として扱う
        // 実際には以下のように変更します:
        // const myUserId = "現在のログインユーザーのID"; // 例
        // const myRecordsSnapshot = await db.collection('records').where('userId', '==', myUserId).get();

        const allRecordsSnapshot = await db.collection('records').orderBy('timestamp', 'desc').get();
        const allRecordsData = allRecordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 仮のユーザーIDを割り当てて、自分の記録と他人の記録を区別する (実際のアプリではログインユーザーIDを使う)
        // 例えば、アプリを初回起動したときにUUIDを生成してlocalStorageに保存し、それをuserIdとして使う
        // ここでは、単純化のため、最初のレコードを自分のレコードとして扱う（非推奨、あくまでデモ用）
        const myUserId = allRecordsData.length > 0 ? allRecordsData[0].userId || 'dummy_user_id' : 'dummy_user_id';
        const myRecords = allRecordsData.filter(record => record.userId === myUserId);
        const otherRecords = allRecordsData.filter(record => record.userId !== myUserId);

        setMyRecords(myRecords);

        const averageLocation = calculateAverageLocation(myRecords);
        setUserLocation(averageLocation); // 自分のよくいる場所として設定

        if (averageLocation) {
          const nearby = [];
          for (const record of otherRecords) {
            const distance = getDistance(
              averageLocation.latitude,
              averageLocation.longitude,
              record.latitude,
              record.longitude
            );
            if (distance <= 10) { // 半径10km以内
              // コメント投稿者のニックネームを取得 (usersコレクションから)
              let userName = '不明なユーザー';
              try {
                // TODO: usersコレクションからnicknameを取得する処理を追加
                // record.userId を使って users コレクションを検索
                // 例: const userDoc = await db.collection('users').doc(record.userId).get();
                // if (userDoc.exists) { userName = userDoc.data().nickname; }
              } catch (userFetchError) {
                console.warn('ユーザー名の取得に失敗:', userFetchError);
              }

              nearby.push({
                id: record.id,
                comment: record.comment,
                userName: userName, // 取得したユーザー名
                timestamp: record.timestamp.toDate ? record.timestamp.toDate() : record.timestamp, // FirestoreのTimestampをDateオブジェクトに変換
              });
            }
          }

          // 直近の3件に絞る
          nearby.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setNearbyComments(nearby.slice(0, 3));
        }
      } catch (error) {
        console.error('マイページデータ取得エラー:', error);
        Alert.alert('エラー', 'データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchMyAndNearbyRecords();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>マイページ</Text>

      {userLocation && (
        <Text style={styles.subtitle}>
          よくいる場所: 緯度 {userLocation.latitude.toFixed(4)}, 経度 {userLocation.longitude.toFixed(4)}
        </Text>
      )}

      <Text style={styles.sectionTitle}>近くの他のユーザーのコメント（直近3件）</Text>
      {nearbyComments.length > 0 ? (
        <FlatList
          data={nearbyComments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <Text style={styles.commentText}>{item.comment}</Text>
              <Text style={styles.commentMeta}>
                {item.userName} ({item.timestamp.toLocaleString()})
              </Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noCommentsText}>まだお知らせがありません</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  commentCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  commentText: {
    fontSize: 16,
    marginBottom: 5,
  },
  commentMeta: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  noCommentsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default MyPageScreen;
