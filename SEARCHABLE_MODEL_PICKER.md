# Searchable Model Picker

## Overview

A reusable modal component that provides a searchable dropdown interface for selecting AI models. Users can search by model name, ID, or description.

## Features

- ✅ **Search functionality** - Filter models by name, ID, or description
- ✅ **Real-time filtering** - Results update as you type
- ✅ **Clear visual feedback** - Selected model is highlighted
- ✅ **Results count** - Shows number of matching models
- ✅ **Empty state** - Helpful message when no models match
- ✅ **Keyboard-friendly** - Clear button and auto-capitalization disabled
- ✅ **Responsive design** - Works on all screen sizes
- ✅ **Smooth animations** - Slide-in modal presentation

## Usage

### Basic Example

```typescript
import { SearchableModelPicker } from '@/src/components/SearchableModelPicker';
import { AI_MODELS } from '@/src/types';

function MyComponent() {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

  return (
    <>
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <Text>Select Model</Text>
      </TouchableOpacity>

      <SearchableModelPicker
        visible={showPicker}
        models={AI_MODELS.openai}
        selectedModelId={selectedModel}
        onSelect={setSelectedModel}
        onClose={() => setShowPicker(false)}
        title="Select OpenAI Model"
      />
    </>
  );
}
```

### With Custom Models

```typescript
const customModels = [
  {
    id: 'custom-model-1',
    name: 'Custom Model 1',
    description: 'A custom model for specific tasks',
  },
  {
    id: 'custom-model-2',
    name: 'Custom Model 2',
    description: 'Another custom model',
  },
];

<SearchableModelPicker
  visible={showPicker}
  models={customModels}
  selectedModelId={selectedModel}
  onSelect={handleModelSelect}
  onClose={() => setShowPicker(false)}
  title="Select Custom Model"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls modal visibility |
| `models` | `ModelOption[]` | Yes | Array of model options |
| `selectedModelId` | `string` | Yes | Currently selected model ID |
| `onSelect` | `(modelId: string) => void` | Yes | Callback when model is selected |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `title` | `string` | No | Modal title (default: "Select Model") |

### ModelOption Interface

```typescript
interface ModelOption {
  id: string;           // Unique identifier
  name: string;         // Display name
  description?: string; // Optional description
}
```

## Implementation in AI Vendor Settings

The component is used in `app/ai-vendor-settings.tsx`:

```typescript
// State
const [showModelPicker, setShowModelPicker] = useState(false);
const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

// Button to open picker
<TouchableOpacity
  style={styles.modelPickerButton}
  onPress={() => setShowModelPicker(true)}
>
  <View style={styles.modelPickerContent}>
    <View style={styles.modelPickerInfo}>
      <Text style={styles.modelPickerLabel}>Selected Model</Text>
      <Text style={styles.modelPickerValue}>
        {AI_MODELS[selectedVendor].find((m) => m.id === selectedModel)?.name}
      </Text>
      <Text style={styles.modelPickerId}>{selectedModel}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </View>
</TouchableOpacity>

// Picker modal
<SearchableModelPicker
  visible={showModelPicker}
  models={AI_MODELS[selectedVendor]}
  selectedModelId={selectedModel}
  onSelect={setSelectedModel}
  onClose={() => setShowModelPicker(false)}
  title={`Select ${selectedVendor} Model`}
/>
```

## Search Behavior

The search is case-insensitive and matches against:
1. **Model name** - e.g., "GPT-4o Mini"
2. **Model ID** - e.g., "gpt-4o-mini"
3. **Model description** - e.g., "Faster and more affordable"

### Search Examples

| Search Query | Matches |
|--------------|---------|
| "gpt" | All GPT models |
| "mini" | GPT-4o Mini, Claude Haiku |
| "fast" | Models with "fast" in description |
| "4o" | GPT-4o, GPT-4o Mini |
| "gemini" | All Gemini models |

## UI Components

### Header
- Close button (left)
- Title (center)
- Placeholder for balance (right)

### Search Bar
- Search icon
- Text input with placeholder
- Clear button (appears when typing)

### Results Count
- Shows "X models" or "X model"
- Updates in real-time

### Model List
- Scrollable list of models
- Each item shows:
  - Model name (bold)
  - Description (if available)
  - Model ID (monospace font)
  - Checkmark for selected model

### Empty State
- Search icon
- "No models found" message
- "Try a different search term" hint

## Styling

The component uses a clean, iOS-inspired design:

- **Colors**:
  - Primary: `#007AFF` (iOS blue)
  - Selected background: `#E3F2FD` (light blue)
  - Text: `#333` (dark gray)
  - Secondary text: `#666`, `#999` (gray shades)
  - Border: `#e0e0e0` (light gray)

- **Typography**:
  - Title: 18px, semibold
  - Model name: 16px, medium
  - Description: 13px, regular
  - Model ID: 11px, monospace

- **Spacing**:
  - Consistent 16px padding
  - 12px for smaller elements
  - 8px for tight spacing

## Accessibility

- ✅ Clear visual hierarchy
- ✅ Sufficient color contrast
- ✅ Touch targets are 44px minimum
- ✅ Keyboard-friendly input
- ✅ Clear button for easy clearing
- ✅ Descriptive empty state

## Performance

- **Memoized filtering** - Uses `useMemo` to avoid unnecessary re-renders
- **Efficient list rendering** - Uses `FlatList` with `keyExtractor`
- **Debounced search** - Filters update immediately but efficiently
- **Lazy rendering** - Only visible items are rendered

## Future Enhancements

Potential improvements:
1. Add categories/sections for model grouping
2. Add model metadata (cost, speed, capabilities)
3. Add favorites/recent models
4. Add model comparison feature
5. Add sorting options (name, date, popularity)
6. Add filter by capabilities (vision, function calling, etc.)
7. Add keyboard shortcuts (Cmd+F to focus search)
8. Add voice search support

## Related Files

- `src/components/SearchableModelPicker.tsx` - Component implementation
- `app/ai-vendor-settings.tsx` - Usage example
- `src/types/ocr.ts` - Model definitions (AI_MODELS)

## Testing

### Manual Testing Checklist

- [ ] Modal opens when button is pressed
- [ ] Search filters models correctly
- [ ] Clear button clears search
- [ ] Selecting a model closes modal
- [ ] Close button closes modal
- [ ] Selected model is highlighted
- [ ] Results count updates correctly
- [ ] Empty state shows when no matches
- [ ] Keyboard dismisses properly
- [ ] Works with different vendors
- [ ] Works with custom model lists

### Edge Cases

- Empty model list
- Single model
- Very long model names
- Models without descriptions
- Duplicate model IDs (should be avoided)
- Special characters in search
- Very long search queries

## Example Model Data

```typescript
export const AI_MODELS: Record<AIVendor, ModelOption[]> = {
  openai: [
    { 
      id: 'gpt-4o', 
      name: 'GPT-4o', 
      description: 'Most capable, best for complex receipts' 
    },
    { 
      id: 'gpt-4o-mini', 
      name: 'GPT-4o Mini', 
      description: 'Faster and more affordable' 
    },
  ],
  google: [
    { 
      id: 'gemini-2.0-flash-exp', 
      name: 'Gemini 2.0 Flash', 
      description: 'Latest and fastest' 
    },
  ],
  // ... more vendors
};
```
