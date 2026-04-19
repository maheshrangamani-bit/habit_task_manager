import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ItemType = 'habit' | 'task';

type Item = {
  id: string;
  title: string;
  type: ItemType;
  completedDates: string[];
  createdAt: string;
};

const STORAGE_KEY = 'habit_task_manager.items';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isDoneToday(item: Item) {
  return item.completedDates.includes(todayKey());
}

export default function App() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ItemType>('habit');
  const [items, setItems] = useState<Item[]>([]);

  const doneCount = useMemo(() => items.filter(isDoneToday).length, [items]);

  useEffect(() => {
    void loadItems();
    void setupNotifications();
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  async function loadItems() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Item[];
      setItems(parsed);
    } catch {
      Alert.alert('Storage error', 'Could not read saved habits and tasks.');
    }
  }

  async function setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getAllScheduledNotificationsAsync();
    if (existing.length > 0) return;

    for (const hour of [8, 12, 16, 20]) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habit check-in',
          body: 'Open the app and complete your pending habits and tasks.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
          channelId: 'reminders',
        },
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Evening wrap-up',
        body: 'Finish any remaining habits and tasks before the day ends.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
        channelId: 'reminders',
      },
    });
  }

  function addItem() {
    const clean = title.trim();
    if (!clean) return;

    const next: Item = {
      id: `${Date.now()}`,
      title: clean,
      type,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    setItems((current) => [next, ...current]);
    setTitle('');
  }

  function toggleDone(id: string) {
    const today = todayKey();
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const done = item.completedDates.includes(today);
        return {
          ...item,
          completedDates: done
            ? item.completedDates.filter((d) => d !== today)
            : [...item.completedDates, today],
        };
      }),
    );
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function checkNow() {
    const pending = items.filter((item) => !isDoneToday(item));
    if (pending.length === 0) {
      Alert.alert('All done 🎉', 'Everything is completed for today.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `You have ${pending.length} pending item${pending.length > 1 ? 's' : ''}`,
        body: pending.slice(0, 3).map((item) => `• ${item.title}`).join('  '),
        sound: true,
      },
      trigger: null,
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0B1020', '#1D2B53', '#2A3E84']} style={styles.background}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>Habit Task Manager</Text>
            <Text style={styles.subheading}>
              {doneCount}/{items.length} completed today
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>Add a new item</Text>
              <TextInput
                placeholder="e.g., Read 20 pages"
                placeholderTextColor="#95A2D5"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <View style={styles.row}>
                <Pressable
                  style={[styles.chip, type === 'habit' && styles.chipActive]}
                  onPress={() => setType('habit')}
                >
                  <Text style={styles.chipText}>Habit</Text>
                </Pressable>
                <Pressable
                  style={[styles.chip, type === 'task' && styles.chipActive]}
                  onPress={() => setType('task')}
                >
                  <Text style={styles.chipText}>Task</Text>
                </Pressable>
                <Pressable style={styles.addButton} onPress={addItem}>
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.reminderButton} onPress={checkNow}>
              <Text style={styles.reminderText}>Check now & send reminder</Text>
            </Pressable>

            {items.map((item) => {
              const done = isDoneToday(item);
              return (
                <View key={item.id} style={[styles.itemCard, done && styles.itemCardDone]}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemType}>{item.type.toUpperCase()}</Text>
                  </View>
                  <View style={styles.row}>
                    <Pressable style={styles.doneButton} onPress={() => toggleDone(item.id)}>
                      <Text style={styles.doneButtonText}>{done ? 'Undo' : 'Done'}</Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={() => removeItem(item.id)}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  background: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subheading: {
    color: '#CDD6FB',
    fontSize: 15,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  label: {
    color: '#E6EBFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(7,12,30,0.75)',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: '#5D75FF',
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addButton: {
    marginLeft: 'auto',
    backgroundColor: '#18B4A6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#04211E',
    fontWeight: '800',
  },
  reminderButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
  },
  reminderText: {
    color: '#DDE5FF',
    textAlign: 'center',
    fontWeight: '700',
  },
  itemCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCardDone: {
    opacity: 0.6,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  itemType: {
    color: '#A7B6ED',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#65D683',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  doneButtonText: {
    color: '#0F3418',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FF8A9A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: '#3B0A12',
    fontWeight: '700',
  },
});
