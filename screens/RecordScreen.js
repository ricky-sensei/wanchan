// screens/RecordScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext'; // useAuthをインポート

const RecordScreen = () => {
  const { currentUser, userProfile } = useAuth(); // 認証状態とユーザープロフィールを取得

  const [comment, setComment] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('位置情報へのアクセスが拒否されました。');
        Alert.alert('権限エラー', '位置情報を取得するために、アプリの設定で位置情報の権限を許可してください。');
        return;
      }
    })();
  }, []);

  const handleShare = async () => {
    if (!comment.trim()) {
      Alert.alert('入力エラー', 'コメントを入力してください。');
      return;
    }

    if (!currentUser || !userProfile) {
      Alert.alert('認証エラー', '記録を投稿するにはログインが必要です。');
      return;
    }

    setLoading(true);
    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      await db.collection('records').add({
        comment: comment,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date(),
        userId: userProfile.userId, // ログインユーザーの8桁のuserIdを紐付け
        firebaseUid: currentUser.uid, // Firebase AuthenticationのUIDも紐付け (検索効率化のため)
      });
      Alert.alert('成功', 'コメントと位置情報が記録されました！');
      setComment('');
    } catch (error) {
      console.error('記録エラー:', error);
      Alert.alert('エラー', '記録に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>コメント</Text>
      <TextInput
        style={styles.input}
        placeholder="今日の出来事を共有しましょう！"
        multiline
        numberOfLines={4}
        value={comment}
        onChangeText={setComment}
      />

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="みんなに知らせる" onPress={handleShare} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default RecordScreen;
