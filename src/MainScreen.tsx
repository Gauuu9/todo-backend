import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, gql } from '@apollo/client';
import { TodoItem } from './components/TodoItem';
import { Todo } from './types';

const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      text
      completed
    }
  }
`;

const ADD_TODO = gql`
  mutation AddTodo($text: String!) {
    addTodo(text: $text) {
      id
      text
      completed
    }
  }
`;

const UPDATE_TODO = gql`
  mutation UpdateTodo($id: ID!, $completed: Boolean!) {
    updateTodo(id: $id, completed: $completed) {
      id
      text
      completed
    }
  }
`;

const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`;

export const MainScreen = ({ navigation }: any) => {
  const [inputText, setInputText] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_TODOS, {
    onError: err => {
      if (err.message.includes('Not authenticated')) {
        handleLogout();
      } else {
        Alert.alert('Error', err.message);
      }
    },
  });

  const [addTodo] = useMutation(ADD_TODO, {
    onCompleted: () => {
      refetch();
    },
    onError: err => {
      Alert.alert('Error', err.message);
    },
  });

  const [updateTodo] = useMutation(UPDATE_TODO, {
    onError: err => {
      Alert.alert('Error', err.message);
    },
  });

  const [deleteTodo] = useMutation(DELETE_TODO, {
    onError: err => {
      Alert.alert('Error', err.message);
    },
  });

  const todos: Todo[] = data?.todos || [];

  const handleAddTodo = () => {
    if (inputText.trim() === '') return;
    addTodo({ variables: { text: inputText.trim() } });
    setInputText('');
  };

  const handleToggleTodo = (id: string) => {
    const todoToUpdate = todos.find(t => t.id === id);
    if (!todoToUpdate) return;
    updateTodo({ variables: { id, completed: !todoToUpdate.completed } });
    refetch();
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodo({ variables: { id } });
    refetch();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    navigation.replace('Auth');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
      ) : (
        <FlatList
          data={todos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggle={() => handleToggleTodo(item.id)}
              onDelete={() => handleDeleteTodo(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks yet. Add one below!</Text>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleAddTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ff5252',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 50,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 25,
    height: 50,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
