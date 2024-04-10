import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import * as React from 'react'
import Auth from './Auth'
import List from './List'
import Menu from './Menu'

import { StatusBar } from 'expo-status-bar'
// import { StatusBar, View } from 'react-native'
import { Platform, StyleSheet, View } from 'react-native'
import { ThemeProvider, colors } from 'react-native-elements'
import { UserContextProvider, useUser } from './UserContext'

const Tab = createBottomTabNavigator()

const Container = () => {
  const { user } = useUser()

  return user ? <Menu /> : <Auth />
  // return user ? <Menu /> : <Menu />
}
const theme = {
  colors: {
    ...Platform.select({
      default: colors.platform.android,
      ios: colors.platform.ios,
    }),
  },
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    // padding: Styles.spacing,
    flex: 1,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
})

export default function App() {
  return (
    <UserContextProvider>
      <ThemeProvider theme={theme}>
        <View style={styles.container}>
          <Container />
          <StatusBar style="auto" />
        </View>
      </ThemeProvider>
    </UserContextProvider>
  )
}
