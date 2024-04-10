import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import * as React from 'react'
// import * as ReactNativeScreens from 'react-native-screens'
import FormScreen from './FormScreen'
import List from './List'
import Recorder from './Recorder'

import { Button } from 'react-native'
import { supabase } from './lib/initSupabase'

const Tab = createBottomTabNavigator()

const handleSignOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  } else {
    // Navigate to the sign-in screen or handle the logged out state as needed
    console.log('Successfully signed out')
  }
}

export default function Menu() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          headerRight: () => <Button onPress={handleSignOut} title="Logout" color="#000" />,
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'Audio To Text') {
              return focused ? (
                <Ionicons name="recording-sharp" size={size} color={color} />
              ) : (
                <Ionicons name="recording-outline" size={size} color={color} />
              )
            } else if (route.name === 'Text To Audio') {
              return focused ? (
                <Ionicons name="text-sharp" size={size} color={color} />
              ) : (
                <Ionicons name="text-outline" size={size} color={color} />
              )
            } else if (route.name === 'List') {
              return focused ? (
                <Ionicons name="list-sharp" size={size} color={color} />
              ) : (
                <Ionicons name="list-outline" size={size} color={color} />
              )
            }
          },
          tabBarActiveTintColor: '#3d3d3d',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="List" component={List} />
        <Tab.Screen name="Audio To Text" component={Recorder} />
        <Tab.Screen name="Text To Audio" component={FormScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
