import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useUser } from './UserContext'
import { supabase } from './lib/initSupabase'

const tableName = 'note'

const List = () => {
  const [data, setData] = React.useState([])
  const [refreshing, setRefreshing] = React.useState(false)
  const [editItemId, setEditItemId] = React.useState(null)
  const [editItemTitle, seteditItemTitle] = React.useState('')
  const [isAdding, setIsAdding] = React.useState(false)
  const [newItemTitle, setnewItemTitle] = React.useState('')
  const [swipeableRow, setSwipeableRow] = React.useState(null)
  const flatListRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const swipeableRefs = React.useRef(new Map()).current
  const { user } = useUser()

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setRefreshing(true)
    const { data, error } = await supabase
      .from('test')
      .select()
      .eq('user_uid', user?.id)
      .order('id', { ascending: true })
    if (error) {
      console.error('Error fetching data:', error)
    } else {
      setData(data as never[])
    }
    for (const ref of swipeableRefs.values()) {
      ref.close()
    }
    setRefreshing(false)
  }

  const handleAddNew = () => {
    setIsAdding(true)
    // Scroll to the end of the list to ensure the input is visible
    setTimeout(() => {
      // Scroll to the end of the list to ensure the input is visible
      flatListRef.current?.scrollToEnd({ animated: true })
      // Focus the input after a short delay to give time for scroll animation
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300) // Adjust this delay as needed
    }, 100) // Adjust this delay as needed
  }

  const handleSaveNew = async () => {
    if (newItemTitle.trim() === '') {
      alert('Item title cannot be empty.')
      return
    }
    const { data: insertData, error } = await supabase
      .from(tableName)
      .insert([{ title: newItemTitle, user_uid: user.id }])
      .select() // Ensure data is returned

    if (error) {
      console.error('Error inserting item:', error)
    } else if (insertData && insertData.length > 0) {
      // Check if insertData is not null and has length before updating the state
      setData((currentData) => [...currentData, ...insertData])
      setnewItemTitle('')
      setIsAdding(false)
    } else {
      console.error('No data returned from insert operation')
    }
  }

  const handleCancelNew = () => {
    setnewItemTitle('')
    setIsAdding(false)
  }

  const handleSwipeableOpen = (itemId: number) => {
    // Close all other swipeables
    swipeableRefs.forEach((ref, id) => {
      if (ref && id !== itemId) {
        ref.close()
      }
    })

    setSwipeableRow((currentRow) => (currentRow === itemId ? null : currentRow))
  }

  const handleSwipeableClose = (itemId: number) => {
    if (swipeableRow === itemId) {
      setSwipeableRow(null)
    }
  }

  const handleEdit = async (id: number, newTitle: string) => {
    const { error } = await supabase.from(tableName).update({ title: newTitle }).eq('id', id)
    if (error) {
      console.error('Error updating item:', error)
    } else {
      setData(data.map((item) => (item.id === id ? { ...item, title: newTitle } : item)))
      setEditItemId(null) // Reset edit state
    }
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id)
    if (error) {
      console.error('Error deleting item:', error)
    } else {
      // Remove the item from the state as well
      setData(data.filter((item) => item.id !== id))
    }
  }

  const initEdit = (id: number, title: string) => {
    setEditItemId(id)
    seteditItemTitle(title)
  }

  const renderRightActions = (id: number, title: string) => {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => initEdit(id, title)} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderItem = ({ item }: { item: { id: number; title: string } }) => {
    if (editItemId === item.id) {
      return (
        <View style={styles.item}>
          <TextInput
            style={styles.input}
            onChangeText={seteditItemTitle}
            value={editItemTitle}
            autoFocus={true}
            onSubmitEditing={() => handleEdit(item.id, editItemTitle)}
          />
        </View>
      )
    }

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.set(item.id, ref)
          } else {
            swipeableRefs.delete(item.id)
          }
        }}
        renderRightActions={() => renderRightActions(item.id, item.title)}
        onSwipeableOpen={() => handleSwipeableOpen(item.id)}
        onSwipeableClose={() => handleSwipeableClose(item.id)}
      >
        <View style={styles.item}>
          <Text style={styles.title}>{item.title}</Text>
        </View>
      </Swipeable>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => `list-item-${item.id}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        ListFooterComponent={
          isAdding ? (
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                onChangeText={setnewItemTitle}
                value={newItemTitle}
                placeholder="Enter item title"
              />
              <TouchableOpacity onPress={handleSaveNew} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelNew} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <></>
          )
        }
      />
      {!isAdding && ( // Only show the Add button if not currently adding a new item
        <TouchableOpacity onPress={handleAddNew} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={50} color="black" />
        </TouchableOpacity>
      )}
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  transcriptionText: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 5,
  },
  title: {
    fontSize: 20,
  },
  deleteButton: {
    backgroundColor: '#616161',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  editButton: {
    backgroundColor: '#ababab',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    height: '100%',
    borderColor: 'gray',
    flex: 1,
    fontSize: 20,
  },
  item: {
    backgroundColor: 'white',
    padding: 20,
    borderWidth: 1, // Add border for the frame
    borderColor: '#ddd', // Set border color
    shadowColor: '#000', // Optional: if you want to add shadow for depth effect
    shadowOffset: { width: 0, height: 1 }, // Optional: shadow offset
    shadowOpacity: 0.22, // Optional: shadow opacity
    shadowRadius: 2.22, // Optional: shadow radius
    elevation: 3, // Optional: elevation for Android
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: 'white',
    borderRadius: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  saveButton: {
    backgroundColor: '#616161',
    padding: 10,
  },
  saveButtonText: {
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#ababab',
    padding: 10,
  },
  cancelButtonText: {
    color: 'white',
  },
})

export default List
