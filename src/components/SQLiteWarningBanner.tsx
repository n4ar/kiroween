import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SQLiteWarningBannerProps {
  onDismiss?: () => void;
}

export function SQLiteWarningBanner({ onDismiss }: SQLiteWarningBannerProps) {
  const handleLearnMore = () => {
    // In a real app, this could open documentation
    console.log('Learn more about SQLite issue');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={24} color="#FF9500" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Database Not Available</Text>
        <Text style={styles.message}>
          Receipt storage is temporarily unavailable. Settings will still work.
        </Text>
        <Text style={styles.hint}>
          Run: <Text style={styles.code}>bun run android</Text> to rebuild
        </Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 11,
  },
  dismissButton: {
    padding: 4,
  },
});
