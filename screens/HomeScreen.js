// screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext'; // useAuthをインポート
import { auth } from '../firebaseConfig'; // authをインポート

const HomeScreen = ({ navigation }) => {
  const { currentUser, userProfile, loading } = useAuth(); // 認証状態とユーザープロフィールを取得

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>認証情報を確認中...</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log("Logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("ログアウトエラー", "ログアウトに失敗しました。");
    }
  };

  return (
    <View style={styles.container}>
      {currentUser && userProfile ? (
        <Text style={styles.title}>ようこそ {userProfile.nickname}さん！</Text>
      ) : (
        <Text style={styles.title}>ようこそ！</Text>
      )}

      {currentUser && userProfile ? (
        // ログインしている場合
        <>
          <View style={styles.buttonContainer}>
            <Button
              title="記録画面へ"
              onPress={() => navigation.navigate('Record')}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="マイページへ"
              onPress={() => navigation.navigate('MyPage')}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="ログアウト"
              onPress={handleLogout}
              color="red"
            />
          </View>
        </>
      ) : (
        // ログインしていない場合
        <>
          <View style={styles.buttonContainer}>
            <Button
              title="登録・ログイン画面へ"
              onPress={() => navigation.navigate('Auth')}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="記録画面へ"
              disabled={true} // 押せないようにする
              onPress={() => Alert.alert("ログインしてください", "記録するにはログインが必要です。")}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="マイページへ"
              disabled={true} // 押せないようにする
              onPress={() => Alert.alert("ログインしてください", "マイページを見るにはログインが必要です。")}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 20,
  },
});

export default HomeScreen;
