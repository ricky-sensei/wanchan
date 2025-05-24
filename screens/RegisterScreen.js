// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert,  } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { db } from '../firebaseConfig'; // Firebaseからdbをインポート

const RegisterScreen = () => {
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('未選択'); // 初期値を設定

  const handleRegister = async () => {
    if (!nickname || !age || gender === '未選択') {
      Alert.alert('入力エラー', 'すべての項目を入力してください。');
      return;
    }
    if (isNaN(parseInt(age))) {
      Alert.alert('入力エラー', '年齢は半角数字で入力してください。');
      return;
    }

    try {
      await db.collection('users').add({
        nickname: nickname,
        age: parseInt(age),
        gender: gender,
        registeredAt: new Date(),
      });
      Alert.alert('登録完了', 'ユーザー情報が登録されました！');
      setNickname('');
      setAge('');
      setGender('未選択');
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      Alert.alert('登録エラー', 'ユーザー情報の登録に失敗しました。');
    }
  };

  return (
    <View style={styles.container}>
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
        onValueChange={(itemValue, itemIndex) => setGender(itemValue)}
      >
        <Picker.Item label="選択してください" value="未選択" />
        <Picker.Item label="男性" value="男性" />
        <Picker.Item label="女性" value="女性" />
        <Picker.Item label="その他" value="その他" />
      </Picker>

      <Button title="登録" onPress={handleRegister} />
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
    borderWidth: 1, // ピッカーの枠線はAndroidで表示されない場合があるので注意
    borderColor: '#ccc',
    borderRadius: 5,
  },
});

export default RegisterScreen;
