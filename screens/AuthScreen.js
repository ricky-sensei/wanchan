// screens/AuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../firebaseConfig'; // dbとauthをインポート
import { generateUniqueUserId } from '../utils/userIdGenerator'; // userIdGeneratorをインポート
import { useNavigation } from '@react-navigation/native'; // ナビゲーションフックをインポート

const AuthScreen = () => {
  const navigation = useNavigation(); // ナビゲーションフックを使用

  const [isRegisterMode, setIsRegisterMode] = useState(true); // 登録モードかログインモードか
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('未選択');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    if (isRegisterMode) {
      // 登録処理
      if (!nickname || !age || gender === '未選択') {
        Alert.alert('入力エラー', 'すべての項目を入力してください。');
        return;
      }
      if (isNaN(parseInt(age))) {
        Alert.alert('入力エラー', '年齢は半角数字で入力してください。');
        return;
      }

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const firebaseUid = userCredential.user.uid; // Firebase AuthenticationのUID

        // ユニークな8桁のuserIdを生成
        const uniqueUserId = await generateUniqueUserId();

        // Firestoreにユーザープロフィールを登録
        await db.collection('users').add({
          firebaseUid: firebaseUid, // Firebase AuthenticationのUIDを保存
          userId: uniqueUserId, // 生成した8桁のユニークID
          nickname: nickname,
          age: parseInt(age),
          gender: gender,
          registeredAt: new Date(),
        });

        Alert.alert('登録完了', 'ユーザー登録が完了しました！');
        // ログインした瞬間にHomeScreenに戻る
        navigation.navigate('Home');
      } catch (error) {
        console.error('ユーザー登録エラー:', error);
        let errorMessage = 'ユーザー登録に失敗しました。';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'このメールアドレスは既に使用されています。';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'パスワードは最低6文字以上にしてください。';
        }
        Alert.alert('登録エラー', errorMessage);
      }
    } else {
      // ログイン処理
      try {
        await auth.signInWithEmailAndPassword(email, password);
        Alert.alert('ログイン成功', 'ログインしました！');
        // ログインした瞬間にHomeScreenに戻る
        navigation.navigate('Home');
      } catch (error) {
        console.error('ログインエラー:', error);
        let errorMessage = 'ログインに失敗しました。';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = 'ユーザー名またはパスワードが間違っています。';
        }
        Alert.alert('ログインエラー', errorMessage);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegisterMode ? 'ユーザー登録' : 'ログイン'}</Text>

      <Text style={styles.label}>メールアドレス</Text>
      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>パスワード</Text>
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {isRegisterMode && (
        <>
          <Text style={styles.label}>ニックネーム</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 太郎"
            value={nickname}
            onChangeText={setNickname}
          />

          <Text style={styles.label}>年齢</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 30"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <Text style={styles.label}>性別</Text>
          <Picker
            selectedValue={gender}
            style={styles.picker}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="選択してください" value="未選択" />
            <Picker.Item label="男性" value="男性" />
            <Picker.Item label="女性" value="女性" />
            <Picker.Item label="その他" value="その他" />
          </Picker>
        </>
      )}

      <Button title={isRegisterMode ? '登録' : 'ログイン'} onPress={handleAuth} />

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsRegisterMode(!isRegisterMode)}
      >
        <Text style={styles.toggleButtonText}>
          {isRegisterMode ? '既にアカウントをお持ちですか？ ログイン' : 'アカウントがありませんか？ 登録'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  toggleButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  toggleButtonText: {
    color: 'blue',
    fontSize: 16,
  },
});

export default AuthScreen;
