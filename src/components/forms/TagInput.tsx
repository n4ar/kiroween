import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  suggestions = [],
  maxTags = 10,
  placeholder = 'Add tag...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const normalizeTag = (tag: string): string => {
    return tag.toLowerCase().trim();
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      normalizeTag(suggestion).includes(normalizeTag(inputValue)) &&
      !tags.includes(normalizeTag(suggestion)) &&
      inputValue.length > 0
  );

  const addTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    if (
      normalized &&
      !tags.includes(normalized) &&
      tags.length < maxTags
    ) {
      onTagsChange([...tags, normalized]);
      setInputValue('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tags Display */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity
                onPress={() => removeTag(tag)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input */}
      {tags.length < maxTags && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text);
              setShowSuggestions(text.length > 0);
            }}
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor="#A0A0A0"
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {inputValue.length > 0 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleSubmit}
            >
              <Ionicons name="add-circle" size={24} color="#6B7F5A" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tag Limit Info */}
      {tags.length >= maxTags && (
        <Text style={styles.limitText}>
          Maximum {maxTags} tags reached
        </Text>
      )}

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => addTag(item)}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color="#6B7F5A"
                />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2C2C2C',
  },
  addButton: {
    padding: 4,
  },
  limitText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 8,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    maxHeight: 150,
    overflow: 'hidden',
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2C2C2C',
  },
});
