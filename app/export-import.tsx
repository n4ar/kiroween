import { exportService } from '@/src/services/export/ExportService';
import { importService } from '@/src/services/export/ImportService';
import { ImportStrategy } from '@/src/types';
import { validatePassword } from '@/src/utils/encryption';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ExportImportScreen() {
  const theme = useTheme();
  const [storageInfo, setStorageInfo] = useState<{
    totalSize: number;
    imageCount: number;
    receiptCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = await exportService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleExport = () => {
    if (!storageInfo || storageInfo.receiptCount === 0) {
      Alert.alert('No Data', 'You have no receipts to export');
      return;
    }

    Alert.prompt(
      'Export Data',
      'Enter a password to encrypt your backup. Remember this password - you will need it to restore your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Error', 'Password is required');
              return;
            }

            const validation = validatePassword(password);
            if (!validation.valid) {
              Alert.alert('Invalid Password', validation.message);
              return;
            }

            await performExport(password);
          },
        },
      ],
      'secure-text'
    );
  };

  const performExport = async (password: string) => {
    try {
      setIsExporting(true);

      const zipPath = await exportService.exportData(password);
      await exportService.shareExport(zipPath);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Export Successful',
        'Your data has been exported and encrypted. Keep your password safe!'
      );
    } catch (error: any) {
      console.error('Export error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Export Failed', error.userMessage || error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;

      Alert.prompt(
        'Import Data',
        'Enter the password you used to encrypt this backup.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Import',
            onPress: async (password) => {
              if (!password) {
                Alert.alert('Error', 'Password is required');
                return;
              }

              showImportStrategyDialog(fileUri, password);
            },
          },
        ],
        'secure-text'
      );
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const showImportStrategyDialog = (fileUri: string, password: string) => {
    Alert.alert(
      'Import Strategy',
      'How should we handle existing receipts?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Merge',
          onPress: () => performImport(fileUri, password, 'merge'),
        },
        {
          text: 'Replace',
          onPress: () => performImport(fileUri, password, 'replace'),
          style: 'destructive',
        },
        {
          text: 'Skip Existing',
          onPress: () => performImport(fileUri, password, 'skip'),
        },
      ]
    );
  };

  const performImport = async (
    fileUri: string,
    password: string,
    strategy: ImportStrategy
  ) => {
    try {
      setIsImporting(true);

      const result = await importService.importData(fileUri, password, strategy);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      let message = `Successfully imported ${result.imported} receipt${result.imported !== 1 ? 's' : ''}`;
      if (result.skipped > 0) {
        message += `\nSkipped ${result.skipped} receipt${result.skipped !== 1 ? 's' : ''}`;
      }
      if (result.errors.length > 0) {
        message += `\n\nErrors:\n${result.errors.slice(0, 3).join('\n')}`;
        if (result.errors.length > 3) {
          message += `\n...and ${result.errors.length - 3} more`;
        }
      }

      Alert.alert('Import Complete', message);

      // Reload storage info
      await loadStorageInfo();
    } catch (error: any) {
      console.error('Import error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Import Failed', error.userMessage || error.message || 'Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#6B7F5A" />
      </View>
    );
  }

  const styles = createStyles(theme.colors, theme.dark);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Storage Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Receipts</Text>
              <Text style={styles.infoValue}>
                {storageInfo?.receiptCount || 0}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Images</Text>
              <Text style={styles.infoValue}>
                {storageInfo?.imageCount || 0}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Size</Text>
              <Text style={styles.infoValue}>
                {formatBytes(storageInfo?.totalSize || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <View style={styles.card}>
            <Ionicons name="download-outline" size={48} color="#6B7F5A" />
            <Text style={styles.cardTitle}>Backup Your Data</Text>
            <Text style={styles.cardDescription}>
              Export all your receipts to an encrypted ZIP file. You&apos;ll need to
              set a password to protect your data.
            </Text>
            <TouchableOpacity
              style={[styles.button, isExporting && styles.buttonDisabled]}
              onPress={handleExport}
              disabled={isExporting || !storageInfo || storageInfo.receiptCount === 0}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Export Data</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Data</Text>
          <View style={styles.card}>
            <Ionicons name="cloud-upload-outline" size={48} color="#6B7F5A" />
            <Text style={styles.cardTitle}>Restore Your Data</Text>
            <Text style={styles.cardDescription}>
              Import receipts from a previously exported backup. You&apos;ll need the
              password you used during export.
            </Text>
            <TouchableOpacity
              style={[styles.button, isImporting && styles.buttonDisabled]}
              onPress={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Import Data</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#6B7F5A" />
          <Text style={styles.noticeText}>
            Your data is encrypted with your password. Make sure to remember it -
            there&apos;s no way to recover your data without it.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7F5A',
    fontFamily: 'JetBrains Mono',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7F5A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    minWidth: 200,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    opacity: 0.7,
    lineHeight: 18,
  },
});
