import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

interface SearchableModelPickerProps {
  visible: boolean;
  models: ModelOption[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
  title?: string;
  onRemoveCustomModel?: (modelId: string) => void;
  customModelIds?: string[];
}

export function SearchableModelPicker({
  visible,
  models,
  selectedModelId,
  onSelect,
  onClose,
  title = 'Select Model',
  onRemoveCustomModel,
  customModelIds = [],
}: SearchableModelPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return models;
    }

    const query = searchQuery.toLowerCase();
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query)
    );
  }, [models, searchQuery]);

  const handleSelect = (modelId: string) => {
    onSelect(modelId);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderModelItem = ({ item }: { item: ModelOption }) => {
    const isSelected = item.id === selectedModelId;
    const isCustom = customModelIds.includes(item.id);

    return (
      <View style={styles.modelItemContainer}>
        <TouchableOpacity
          style={[styles.modelItem, isSelected && styles.modelItemSelected]}
          onPress={() => handleSelect(item.id)}
        >
          <View style={styles.modelInfo}>
            <View style={styles.modelNameRow}>
              <Text style={[styles.modelName, isSelected && styles.modelNameSelected]}>
                {item.name}
              </Text>
              {isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text style={styles.modelDescription}>{item.description}</Text>
            )}
            <Text style={styles.modelId}>{item.id}</Text>
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        {isCustom && onRemoveCustomModel && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onRemoveCustomModel(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search models..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'}
          </Text>
        </View>

        {/* Model List */}
        <FlatList
          data={filteredModels}
          renderItem={renderModelItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No models found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 16,
  },
  modelItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modelItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modelItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  modelInfo: {
    flex: 1,
    marginRight: 12,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modelNameSelected: {
    color: '#007AFF',
  },
  customBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FF9500',
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 12,
    paddingRight: 16,
  },
  modelDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  modelId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});
