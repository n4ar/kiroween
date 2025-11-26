import { useReceipts } from '@/src/hooks/useReceipts';
import { Receipt, SearchCriteria } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function SearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { searchReceipts, getAllTags } = useReceipts();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  const allTags = useMemo(() => getAllTags(), [getAllTags]);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchCriteria: SearchCriteria = useMemo(() => {
    const criteria: SearchCriteria = {};

    if (debouncedQuery) {
      criteria.query = debouncedQuery;
    }

    if (selectedTags.length > 0) {
      criteria.tags = selectedTags;
    }

    if (dateFrom) {
      criteria.dateFrom = dateFrom;
    }

    if (dateTo) {
      criteria.dateTo = dateTo;
    }

    if (minAmount) {
      const amount = parseFloat(minAmount);
      if (!isNaN(amount)) {
        criteria.minAmount = Math.round(amount * 100);
      }
    }

    if (maxAmount) {
      const amount = parseFloat(maxAmount);
      if (!isNaN(amount)) {
        criteria.maxAmount = Math.round(amount * 100);
      }
    }

    return criteria;
  }, [debouncedQuery, selectedTags, dateFrom, dateTo, minAmount, maxAmount]);

  const filteredReceipts = useMemo(() => {
    return searchReceipts(searchCriteria);
  }, [searchCriteria, searchReceipts]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters =
    selectedTags.length > 0 ||
    dateFrom ||
    dateTo ||
    minAmount ||
    maxAmount;

  const styles = createStyles(theme.colors, theme.dark);

  const renderReceiptCard = ({ item }: { item: Receipt }) => {
    const formattedAmount = `$${(item.totalAmount / 100).toFixed(2)}`;
    const formattedDate = item.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: '/receipt-detail',
            params: { receiptId: item.id },
          });
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.storeName} numberOfLines={1}>
            {item.storeName}
          </Text>
          <Text style={styles.amount}>{formattedAmount}</Text>
        </View>
        <Text style={styles.date}>{formattedDate}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={theme.colors.text} style={{ opacity: 0.6 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search receipts..."
            placeholderTextColor={theme.dark ? '#888' : '#A0A0A0'}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={hasActiveFilters ? '#FFFFFF' : '#6B7F5A'}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Tags Filter */}
          {allTags.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {allTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      selectedTags.includes(tag) && styles.tagChipActive,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        selectedTags.includes(tag) &&
                          styles.tagChipTextActive,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Amount Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Amount Range</Text>
            <View style={styles.amountRow}>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountField}
                  value={minAmount}
                  onChangeText={setMinAmount}
                  placeholder="Min"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.amountSeparator}>to</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountField}
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                  placeholder="Max"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>
          {filteredReceipts.length} result{filteredReceipts.length !== 1 ? 's' : ''}
        </Text>
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceiptCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#D4A574" />
              <Text style={styles.emptyText}>No receipts found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B7F5A',
  },
  filterButtonActive: {
    backgroundColor: '#6B7F5A',
  },
  filtersContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipActive: {
    backgroundColor: '#6B7F5A',
    borderColor: '#6B7F5A',
  },
  tagChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
    borderRadius: 8,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'JetBrains Mono',
  },
  amountField: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'JetBrains Mono',
  },
  amountSeparator: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  clearButton: {
    padding: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7F5A',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7F5A',
    fontFamily: 'JetBrains Mono',
  },
  date: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    fontFamily: 'JetBrains Mono',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    marginTop: 16,
  },
});
