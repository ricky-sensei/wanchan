import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ようこそ！</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="登録画面へ"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
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
