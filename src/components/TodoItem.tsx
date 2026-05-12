import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// This component represents a single Todo item in our list.
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  return (
    <View style={styles.container}>
      {/* 
        TouchableOpacity makes the view respond to touches. 
        Here it acts as a toggle button for the completion status. 
      */}
      <TouchableOpacity 
        style={styles.todoTextContainer} 
        onPress={() => onToggle(todo.id)}
      >
        <Text style={[styles.todoText, todo.completed && styles.completedText]}>
          {todo.text}
        </Text>
      </TouchableOpacity>

      {/* Button to delete the task */}
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => onDelete(todo.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // For Android shadow
  },
  todoTextContainer: {
    flex: 1, // Takes up remaining space
  },
  todoText: {
    fontSize: 16,
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    backgroundColor: '#ff5252',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
