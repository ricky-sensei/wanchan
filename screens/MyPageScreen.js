// screens/MyPageScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext'; // useAuthをインポート
import * as Location from 'expo-location';

const MyPageScreen = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth(); // 認証情報を取得

  const [myRecords, setMyRecords] = useState([]);
  const [nearbyComments, setNearbyComments] = useState([]);
  const [loading, setLoading] = useState(true); // MyPageのデータロード
  const [userAverageLocation, setUserAverageLocation] = useState(null);

  // 距離の計算
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
      if (!currentUser || !userProfile) {
        setLoading(false);
        Alert.alert('ログインしてください', 'マイページを見るにはログインが必要です。');
        return;
      }

      setLoading(true);
      try {
        const myUserId = userProfile.userId; 

        // 1. 自分の記録を取得し、平均位置を計算
        const myRecordsSnapshot = await db.collection('records')
          .where('userId', '==', myUserId) // 自分のIDでフィルタ
          .orderBy('timestamp', 'desc')
          .get();

        const myRecordsData = myRecordsSnapshot.docs.map(doc => doc.data());
        setMyRecords(myRecordsData);

        let totalLat = 0;
        let totalLon = 0;
        let count = 0;
        myRecordsData.forEach(record => {
          totalLat += record.latitude;
          totalLon += record.longitude;
          count++;
        });

        const averageLocation = count > 0 ? {
          latitude: totalLat / count,
          longitude: totalLon / count,
        } : null;
        setUserAverageLocation(averageLocation);

        if (averageLocation) {
          // 2. 他のユーザーの記録を取得し、自分の平均位置から10km以内のものを抽出
          const otherRecords = [];
          const allRecordsSnapshot = await db.collection('records')
            .orderBy('timestamp', 'desc') // 直近のコメントのために降順で取得
            .get();

          for (const doc of allRecordsSnapshot.docs) {
            const record = doc.data();
            // 自分の投稿は除外
            if (record.userId === myUserId) {
              continue;
            }

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
                // record.firebaseUid を使って users コレクションを検索
                const userDocSnapshot = await db.collection('users').where('firebaseUid', '==', record.firebaseUid).limit(1).get();
                if (!userDocSnapshot.empty) {
                  userName = userDocSnapshot.docs[0].data().nickname;
                }
              } catch (userFetchError) {
                console.warn('ユーザー名の取得に失敗:', userFetchError);
              }

              nearbyComments.push({
                id: doc.id,
                comment: record.comment,
                userName: userName,
                timestamp: record.timestamp.toDate ? record.timestamp.toDate() : record.timestamp,
              });
            }
          }

          // 直近の3件に絞る 
          setNearbyComments(nearbyComments.slice(0, 3));
        } else {
          // 自分の記録がない場合、近くのコメントも表示しない
          setNearbyComments([]);
        }

      } catch (error) {
        console.error('マイページデータ取得エラー:', error);
        Alert.alert('エラー', 'データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchMyAndNearbyRecords();
  }, [currentUser, userProfile, authLoading]); // currentUser, userProfile, authLoading が変更されたら再実行

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>データを読み込み中...</Text>
      </View>
    );
  }

  // ログインしていない場合
  if (!currentUser || !userProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.noCommentsText}>マイページを見るにはログインが必要です。</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>マイページ</Text>

      {userAverageLocation ? (
        <Text style={styles.subtitle}>
          あなたのよくいる場所: 緯度 {userAverageLocation.latitude.toFixed(4)}, 経度 {userAverageLocation.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.subtitle}>
          まだ記録がないため、よくいる場所は算出できません。
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
        color: '#555',
  },
  sectionTitle: {
  },
  noCommentsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default MyPageScreen;
