import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
// import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import FormScreen from './FormScreen'
import Recorder from './Recorder'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            // const iconName = ''

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
            }
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Audio To Text" component={Recorder} />
        <Tab.Screen name="Text To Audio" component={FormScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
