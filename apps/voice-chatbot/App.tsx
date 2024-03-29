import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
// import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import FormScreen from './FormScreen'
import Recorder from './Recorder'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = ''

            if (route.name === 'Audio To Text') {
              iconName = focused ? 'recording-sharp' : 'recording-outline'
            } else if (route.name === 'Text To Audio') {
              iconName = focused ? 'text-sharp' : 'text-outline'
            }
            return <Ionicons name={iconName} size={size} color={color} />
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
